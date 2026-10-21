import { Controller, Get, Inject } from "@nestjs/common";
import { count } from "drizzle-orm";
import { Db } from "./db/db.module";
import { DRIZZLE } from "./db/db.constants";
import { abilities, users } from "./db/schema";
import { Public } from "./auth/public.decorator";

@Controller()
export class AppController {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  // Simple liveness + DB check; public so uptime monitors don't need a token.
  @Public()
  @Get("health")
  async health() {
    const [a] = await this.db.select({ n: count() }).from(abilities);
    const [u] = await this.db.select({ n: count() }).from(users);
    return { ok: true, abilities: a.n, users: u.n };
  }
}
