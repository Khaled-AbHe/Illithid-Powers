import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { ROOT_KEY } from "../abilities/abilities.constants";
import { hashPassword } from "../auth/password";
import * as schema from "./schema";

const { users, userAbilities } = schema;

/**
 * TEST ONLY. Creates a DM and a few players for the frontend's integration
 * tests and for trying the API locally. It refuses to run unless NODE_ENV=test,
 * so it can never put accounts with known passwords into a real database.
 *
 * Reads DM_PASSWORD, SEED_PLAYERS (comma-separated names) and
 * PLAYER_PASSWORD_<NAME>. Existing accounts are left untouched.
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function main() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("seed-test-accounts only runs with NODE_ENV=test");
  }
  const db = drizzle(
    createClient({
      url: requireEnv("TURSO_DATABASE_URL"),
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }),
    { schema },
  );

  const playerNames = (process.env.SEED_PLAYERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Resolve every password first so a missing one fails before anything is written.
  const dmPassword = requireEnv("DM_PASSWORD");
  const playerPasswords = playerNames.map(
    (n) => [n, requireEnv(`PLAYER_PASSWORD_${n.toUpperCase()}`)] as const,
  );

  const find = async (username: string) =>
    (await db.select({ id: users.id }).from(users).where(eq(users.username, username)))[0];

  let dm = await find("DM");
  if (!dm) {
    [dm] = await db
      .insert(users)
      .values({ username: "DM", passwordHash: await hashPassword(dmPassword), role: "dm" })
      .returning({ id: users.id });
    console.log("  + DM (dm) created");
  }

  for (const [username, password] of playerPasswords) {
    let player = await find(username);
    if (!player) {
      [player] = await db
        .insert(users)
        .values({
          username,
          passwordHash: await hashPassword(password),
          role: "player",
          dmId: dm.id,
        })
        .returning({ id: users.id });
      console.log(`  + ${username} (player) created`);
    }
    await db
      .insert(userAbilities)
      .values({ userId: player.id, abilityKey: ROOT_KEY })
      .onConflictDoNothing();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
