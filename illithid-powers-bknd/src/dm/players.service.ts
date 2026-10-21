import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { ROOT_KEY } from "../abilities/abilities.constants";
import { isUniqueViolation } from "../common/db-errors";
import { foldUsername } from "../common/username";
import { hashPassword } from "../auth/password";
import { DRIZZLE } from "../db/db.constants";
import type { Db } from "../db/db.module";
import { userAbilities, users } from "../db/schema";

@Injectable()
export class PlayersService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /** The calling DM's own players (never other DMs' players, never DMs) with balance and claimed keys in claim order. */
  async list(dmId: number) {
    const players = await this.db
      .select({ id: users.id, username: users.username, vials: users.vials })
      .from(users)
      .where(and(eq(users.role, "player"), eq(users.dmId, dmId)))
      .orderBy(asc(users.id));
    if (players.length === 0) return [];

    const rows = await this.db
      .select({ userId: userAbilities.userId, key: userAbilities.abilityKey })
      .from(userAbilities)
      .where(
        inArray(
          userAbilities.userId,
          players.map((p) => p.id),
        ),
      )
      .orderBy(asc(userAbilities.claimedAt), sql`rowid`);

    const claimed = new Map<number, string[]>();
    for (const r of rows) claimed.set(r.userId, [...(claimed.get(r.userId) ?? []), r.key]);
    return players.map((p) => ({ ...p, claimed: claimed.get(p.id) ?? [] }));
  }

  /**
   * 404 unless `id` is a player owned by this DM. DM accounts and other DMs'
   * players are not valid targets, and look exactly like players that don't
   * exist, so one DM can't learn whether another DM's player exists.
   */
  async requirePlayer(id: number, dmId: number) {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "player"), eq(users.dmId, dmId)));
    if (!row) throw new NotFoundException(`Player ${id} not found`);
  }

  /** Is this name used by another account, ignoring capitals and how accents were typed? */
  private async isTaken(username: string, exceptId?: number) {
    const key = foldUsername(username);
    const rows = await this.db.select({ id: users.id, username: users.username }).from(users);
    return rows.some((r) => r.id !== exceptId && foldUsername(r.username) === key);
  }

  async create(dmId: number, username: string, password: string) {
    if (await this.isTaken(username))
      throw new ConflictException(`Username "${username}" is taken`);

    const passwordHash = await hashPassword(password);
    try {
      return await this.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ username, passwordHash, role: "player", vials: 0, dmId })
          .returning({ id: users.id, username: users.username, vials: users.vials });
        await tx.insert(userAbilities).values({ userId: user.id, abilityKey: ROOT_KEY });
        return { ...user, claimed: [ROOT_KEY] };
      });
    } catch (e) {
      // Lost a race with another create of the same name.
      if (isUniqueViolation(e)) {
        throw new ConflictException(`Username "${username}" is taken`);
      }
      throw e;
    }
  }

  /**
   * Change a player's login name. Sessions follow the account (the id), so nobody
   * is signed out. Names stay unique ignoring capitals, but renaming a player to a
   * different capitalisation of their own name is fine.
   */
  async rename(id: number, username: string) {
    if (await this.isTaken(username, id))
      throw new ConflictException(`Username "${username}" is taken`);

    try {
      const [row] = await this.db
        .update(users)
        .set({ username })
        .where(eq(users.id, id))
        .returning({ id: users.id, username: users.username });
      return row;
    } catch (e) {
      // Lost a race with another create or rename of the same name.
      if (isUniqueViolation(e)) {
        throw new ConflictException(`Username "${username}" is taken`);
      }
      throw e;
    }
  }

  /**
   * Permanently delete a player and their claimed powers, in one transaction.
   * The claims are deleted explicitly rather than left to the foreign key's
   * cascade, so it behaves the same on every database. Ids are never reused, so
   * the player's old tokens can't work for anyone else, and the JWT guard already
   * rejects tokens for users that no longer exist.
   */
  remove(id: number) {
    return this.db.transaction(async (tx) => {
      await tx.delete(userAbilities).where(eq(userAbilities.userId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async setPassword(id: number, password: string) {
    await this.db
      .update(users)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(users.id, id));
  }

  /** The only way a balance is ever set directly; players can't reach this. */
  async setVials(id: number, available: number) {
    const [row] = await this.db
      .update(users)
      .set({ vials: available })
      .where(eq(users.id, id))
      .returning({ id: users.id, vials: users.vials });
    return row;
  }

  /** Back to a fresh player: only the root ability and 0 vials (what the old Reset button did). */
  reset(id: number) {
    return this.db.transaction(async (tx) => {
      const removed = await tx
        .delete(userAbilities)
        .where(and(eq(userAbilities.userId, id), ne(userAbilities.abilityKey, ROOT_KEY)))
        .returning({ key: userAbilities.abilityKey });
      await tx
        .insert(userAbilities)
        .values({ userId: id, abilityKey: ROOT_KEY })
        .onConflictDoNothing();
      await tx.update(users).set({ vials: 0 }).where(eq(users.id, id));
      return { removed: removed.map((r) => r.key), vials: 0 };
    });
  }
}
