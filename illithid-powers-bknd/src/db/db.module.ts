import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { DRIZZLE } from "./db.constants";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Db => {
        const client = createClient({
          url: config.getOrThrow<string>("TURSO_DATABASE_URL"),
          authToken: config.get<string>("TURSO_AUTH_TOKEN") || undefined,
        });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
