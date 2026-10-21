import { sql } from "drizzle-orm";
import {
  AnySQLiteColumn,
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const ROLES = ["player", "dm"] as const;
export type Role = (typeof ROLES)[number];

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ROLES }).notNull().default("player"),
    // Current vial balance. Only the DM can set it; claims spend it, revokes refund it.
    vials: integer("vials").notNull().default(0),
    // The DM who owns a player (null for DMs). Every DM route is limited to the
    // caller's own players. Not enforced by a CHECK because SQLite can't add one to
    // an existing table without rebuilding it; the service and tests enforce it.
    dmId: integer("dm_id").references((): AnySQLiteColumn => users.id),
    // Google's stable user id for a DM who signs in with Google (null for players, and for
    // any DM that predates Google sign-in). The email can change; this never does.
    googleSub: text("google_sub").unique(),
  },
  (t) => [
    index("users_dm_id_idx").on(t.dmId),
    check("users_vials_non_negative", sql`${t.vials} >= 0`),
    check("users_role_valid", sql`${t.role} in ('player', 'dm')`),
  ],
);

export const abilities = sqliteTable(
  "abilities",
  {
    // Stable key, e.g. "ForcePush" (the frontend's powerKey).
    key: text("key").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    vialCost: integer("vial_cost").notNull(),
    // Any-of prerequisites: claimable if at least one of these keys is claimed.
    // An empty array means no prerequisite.
    requires: text("requires", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
  },
  (t) => [check("abilities_cost_non_negative", sql`${t.vialCost} >= 0`)],
);

export const userAbilities = sqliteTable(
  "user_abilities",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    abilityKey: text("ability_key")
      .notNull()
      .references(() => abilities.key),
    claimedAt: integer("claimed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.abilityKey] })],
);

export type User = typeof users.$inferSelect;
export type Ability = typeof abilities.$inferSelect;
export type UserAbility = typeof userAbilities.$inferSelect;
