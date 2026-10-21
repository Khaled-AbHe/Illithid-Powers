import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { DRIZZLE } from "../db/db.constants";
import { isUniqueViolation } from "../common/db-errors";
import { GoogleVerifier } from "./google/google.verifier";
import { hashPassword, hashPasswordSync } from "./password";
import type { Db } from "../db/db.module";
import { users, type User } from "../db/schema";
import type { JwtPayload } from "./auth.types";

@Injectable()
export class AuthService {
  // Compared against when the username doesn't exist, so response time
  // doesn't reveal which usernames are real.
  private readonly dummyHash = hashPasswordSync(randomBytes(16).toString("hex"));

  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly jwt: JwtService,
    private readonly google: GoogleVerifier,
  ) {}

  async login(username: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));

    const ok = await bcrypt.compare(password, user?.passwordHash ?? this.dummyHash);
    if (!user || !ok) {
      throw new UnauthorizedException("Invalid username or password");
    }

    return this.issueToken(user);
  }

  /**
   * Sign in (or sign up) a DM with a Google credential. The first time a Google
   * account is seen, a DM account is created for it; after that it just signs in.
   * Players never use this: they are created by a DM and log in with a password.
   */
  async googleLogin(credential: string) {
    const identity = await this.google.verify(credential);
    if (!identity.emailVerified) {
      throw new UnauthorizedException("Your Google email address is not verified");
    }

    let [user] = await this.db.select().from(users).where(eq(users.googleSub, identity.sub));
    if (!user) user = await this.createGoogleDm(identity.sub, identity.email.toLowerCase());
    return this.issueToken(user);
  }

  private async createGoogleDm(googleSub: string, email: string): Promise<User> {
    const [taken] = await this.db.select().from(users).where(eq(users.username, email));
    if (taken) {
      // The same Google account created it a moment ago (two first sign-ins at once): use it.
      if (taken.googleSub === googleSub) return taken;
      throw new ConflictException("That email address is already used by another account");
    }
    try {
      const [created] = await this.db
        .insert(users)
        .values({
          username: email,
          // No password: this account signs in through Google only. The value is random
          // and never stored anywhere else, so no password can ever match it.
          passwordHash: await hashPassword(randomBytes(32).toString("hex")),
          role: "dm",
          googleSub,
        })
        .returning();
      return created;
    } catch (err) {
      // Two first sign-ins for the same Google account at once: use the one that won.
      if (isUniqueViolation(err)) {
        const [existing] = await this.db.select().from(users).where(eq(users.googleSub, googleSub));
        if (existing) return existing;
      }
      throw err;
    }
  }

  private async issueToken(user: Pick<User, "id" | "username" | "role">) {
    const payload: JwtPayload = {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}
