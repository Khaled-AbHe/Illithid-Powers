import { and, eq, inArray, ne } from "drizzle-orm";
import { ROOT_KEY } from "../abilities/abilities.constants";
import type { Db } from "./db.module";
import { userAbilities, users } from "./schema";

export interface RetireOptions {
  /** The DM account to delete. */
  dmUsername: string;
  /** Nothing is deleted unless this is true: the default is a dry run. */
  execute: boolean;
  /** Allow deleting the only DM account (otherwise nobody could log in as a DM afterwards). */
  allowNoOtherDm?: boolean;
}

export interface RetireReport {
  dm: { id: number; username: string };
  /** Players that go with the DM, with what they have (not counting the free root power). */
  players: { id: number; username: string; powers: number; vials: number }[];
  otherDms: number;
  executed: boolean;
}

/**
 * Deletes a DM account together with every player it owns and their claimed
 * powers, in one transaction. Meant for retiring an old password-based DM once
 * Google sign-in is live. A dry run (the default) only reports what it would do.
 */
export async function retireDm(db: Db, opts: RetireOptions): Promise<RetireReport> {
  const [dm] = await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .where(eq(users.username, opts.dmUsername));
  if (!dm) throw new Error(`No account named "${opts.dmUsername}".`);
  if (dm.role !== "dm")
    throw new Error(`"${opts.dmUsername}" is not a DM account, refusing to delete it.`);

  const owned = await db
    .select({ id: users.id, username: users.username, vials: users.vials })
    .from(users)
    .where(and(eq(users.role, "player"), eq(users.dmId, dm.id)));
  const claims = owned.length
    ? await db
        .select({ userId: userAbilities.userId })
        .from(userAbilities)
        .where(
          and(
            inArray(
              userAbilities.userId,
              owned.map((p) => p.id),
            ),
            ne(userAbilities.abilityKey, ROOT_KEY),
          ),
        )
    : [];
  const players = owned.map((p) => ({
    ...p,
    powers: claims.filter((c) => c.userId === p.id).length,
  }));

  const others = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "dm"), ne(users.id, dm.id)));
  if (others.length === 0 && !opts.allowNoOtherDm) {
    throw new Error(
      `"${dm.username}" is the only DM account. Sign in with another DM first, or pass --allow-no-other-dm.`,
    );
  }

  const report: RetireReport = {
    dm: { id: dm.id, username: dm.username },
    players,
    otherDms: others.length,
    executed: false,
  };
  if (!opts.execute) return report;

  await db.transaction(async (tx) => {
    const ids = players.map((p) => p.id);
    if (ids.length) {
      await tx.delete(userAbilities).where(inArray(userAbilities.userId, ids));
      await tx.delete(users).where(inArray(users.id, ids));
    }
    await tx.delete(users).where(eq(users.id, dm.id));
  });
  return { ...report, executed: true };
}
