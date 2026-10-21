import { Controller, Get, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { DRIZZLE } from "../db/db.constants";
import type { Db } from "../db/db.module";
import { users } from "../db/schema";

@Controller("me")
export class MeController {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    const [row] = await this.db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        vials: users.vials,
      })
      .from(users)
      .where(eq(users.id, user.id));
    return row;
  }
}
