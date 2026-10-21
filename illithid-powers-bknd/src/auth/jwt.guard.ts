import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { DRIZZLE } from "../db/db.constants";
import type { Db } from "../db/db.module";
import { users } from "../db/schema";
import type { AuthUser, JwtPayload } from "./auth.types";
import { IS_PUBLIC_KEY } from "./public.decorator";

const INVALID = "Invalid or expired token";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(DRIZZLE) private readonly db: Db,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: JwtPayload;
    try {
      // Pin the algorithm so a forged "alg: none" token can never pass.
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        algorithms: ["HS256"],
      });
    } catch {
      throw new UnauthorizedException(INVALID);
    }

    const id = Number(payload.sub);
    if (!Number.isInteger(id)) throw new UnauthorizedException(INVALID);

    // The DB is the source of truth: deleted users are locked out and
    // role changes (e.g. a DM demoted to player) apply immediately.
    const [user] = await this.db
      .select({ id: users.id, username: users.username, role: users.role })
      .from(users)
      .where(eq(users.id, id));
    if (!user) throw new UnauthorizedException(INVALID);

    req.user = user;
    return true;
  }
}
