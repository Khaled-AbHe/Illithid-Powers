import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const { abilities } = schema;

type SeedAbility = {
  key: string;
  name: string;
  description: string;
  vialCost: number;
  requires: string[];
};

/**
 * Syncs the ability catalog (the powers themselves) to the database. Safe to
 * re-run at any time. It creates no accounts: DMs sign in through Google and
 * create their own players.
 */
async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("Missing env var TURSO_DATABASE_URL");
  const db = drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined }), {
    schema,
  });

  const catalog: SeedAbility[] = JSON.parse(
    readFileSync(join(__dirname, "abilities.seed.json"), "utf8"),
  );
  for (const a of catalog) {
    await db
      .insert(abilities)
      .values(a)
      .onConflictDoUpdate({
        target: abilities.key,
        set: {
          name: a.name,
          description: a.description,
          vialCost: a.vialCost,
          requires: a.requires,
        },
      });
  }
  console.log(`Abilities synced: ${catalog.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
