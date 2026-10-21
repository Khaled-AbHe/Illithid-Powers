import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { retireDm } from "./retire-dm";
import * as schema from "./schema";

/**
 * Usage:
 *   npm run db:retire-dm -- --dm DM                 dry run: lists what would be deleted
 *   npm run db:retire-dm -- --dm DM --yes           actually delete it
 *   add --allow-no-other-dm to delete the only DM account
 */
async function main() {
  const args = process.argv.slice(2);
  const flag = (name: string) => args.includes(name);
  const dmIndex = args.indexOf("--dm");
  const dmUsername = dmIndex >= 0 ? args[dmIndex + 1] : undefined;
  if (!dmUsername || dmUsername.startsWith("--")) {
    throw new Error("Pass the DM account to retire: --dm <username>");
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("Missing env var TURSO_DATABASE_URL");
  const db = drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined }), {
    schema,
  });

  const report = await retireDm(db, {
    dmUsername,
    execute: flag("--yes"),
    allowNoOtherDm: flag("--allow-no-other-dm"),
  });

  console.log(`Database: ${url}`);
  console.log(
    `DM account: ${report.dm.username} (id ${report.dm.id}); other DM accounts: ${report.otherDms}`,
  );
  console.log(
    `Players that ${report.executed ? "were" : "would be"} deleted with it: ${report.players.length}`,
  );
  for (const p of report.players) {
    console.log(
      `  - ${p.username}: ${p.powers} claimed power(s) besides the free one, ${p.vials} vial(s)`,
    );
  }
  console.log(
    report.executed ? "Done." : "Dry run: nothing was deleted. Re-run with --yes to delete.",
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
