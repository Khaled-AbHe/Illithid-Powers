import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { DRIZZLE } from "../db/db.constants";
import type { Db } from "../db/db.module";
import { abilities, userAbilities, users } from "../db/schema";
import { ROOT_KEY } from "./abilities.constants";
import { computeRevoke, OwnedAbility, previewRevoke } from "./cascade";

export interface ClaimResult {
  key: string;
  /** True when the player already owned it; nothing was charged. */
  alreadyClaimed: boolean;
  charged: number;
  /** The player's balance after the claim. */
  vials: number;
}

export interface RevokePreviewResult {
  key: string;
  /** False when the player doesn't own it, so a revoke would change nothing. */
  owned: boolean;
  removed: { key: string; name: string; vialCost: number }[];
  refund: number;
  /** Balance now, and what it would be after the revoke. */
  vials: number;
  vialsAfter: number;
  /** Spared because another prerequisite is still owned (any-of). */
  kept: { key: string; name: string; via: { key: string; name: string }[] }[];
}

export interface RevokeResult {
  /** The revoked ability first, then everything that cascaded from it. */
  removed: string[];
  refunded: number;
  /** The player's balance after the refund. */
  vials: number;
}

@Injectable()
export class AbilitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /** The full ability catalog, cheapest first. */
  catalog() {
    return this.db.select().from(abilities).orderBy(asc(abilities.vialCost), asc(abilities.name));
  }

  async claimedKeys(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({ key: userAbilities.abilityKey })
      .from(userAbilities)
      .where(eq(userAbilities.userId, userId))
      // claimed_at only has 1-second resolution, so rowid (insertion order) breaks ties.
      .orderBy(asc(userAbilities.claimedAt), sql`rowid`);
    return rows.map((r) => r.key);
  }

  /**
   * Claim an ability for a player. This one path serves both a player's own
   * claim and a DM grant, so the rules are identical: at least one prerequisite
   * must already be claimed (any-of), and the player needs enough vials.
   * Everything happens in one transaction, and the balance is decremented with
   * a conditional UPDATE so two simultaneous claims can never spend the same
   * vials twice.
   */
  claim(userId: number, key: string): Promise<ClaimResult> {
    return this.db.transaction(async (tx) => {
      const [ability] = await tx.select().from(abilities).where(eq(abilities.key, key));
      if (!ability) throw new NotFoundException(`Unknown ability "${key}"`);

      const ownedRows = await tx
        .select({ key: userAbilities.abilityKey })
        .from(userAbilities)
        .where(eq(userAbilities.userId, userId));
      const owned = new Set(ownedRows.map((r) => r.key));

      const balance = async () => {
        const [u] = await tx.select({ vials: users.vials }).from(users).where(eq(users.id, userId));
        return u.vials;
      };

      if (owned.has(key)) {
        return { key, alreadyClaimed: true, charged: 0, vials: await balance() };
      }

      if (ability.requires.length > 0 && !ability.requires.some((r) => owned.has(r))) {
        throw new ForbiddenException({
          statusCode: 403,
          error: "Forbidden",
          code: "MISSING_REQUIREMENTS",
          message: `Missing requirements: claim one of ${ability.requires.join(", ")} first`,
          requires: ability.requires,
        });
      }

      // The primary key makes a concurrent duplicate claim a no-op instead of an error.
      const inserted = await tx
        .insert(userAbilities)
        .values({ userId, abilityKey: key })
        .onConflictDoNothing()
        .returning({ key: userAbilities.abilityKey });
      if (inserted.length === 0) {
        return { key, alreadyClaimed: true, charged: 0, vials: await balance() };
      }

      const updated = await tx
        .update(users)
        .set({ vials: sql`${users.vials} - ${ability.vialCost}` })
        .where(and(eq(users.id, userId), gte(users.vials, ability.vialCost)))
        .returning({ vials: users.vials });
      if (updated.length === 0) {
        const available = await balance();
        // Throwing rolls the transaction back, which removes the claim row above.
        throw new ForbiddenException({
          statusCode: 403,
          error: "Forbidden",
          code: "NOT_ENOUGH_VIALS",
          message: `Not enough vials: needs ${ability.vialCost}, balance is ${available}`,
          needed: ability.vialCost,
          available,
          shortfall: ability.vialCost - available,
        });
      }

      return { key, alreadyClaimed: false, charged: ability.vialCost, vials: updated[0].vials };
    });
  }

  /** 404 for an unknown ability, 400 for the root. Shared by revoke and its preview. */
  private async assertRevocable(reader: Pick<Db, "select">, key: string) {
    const [ability] = await reader.select().from(abilities).where(eq(abilities.key, key));
    if (!ability) throw new NotFoundException(`Unknown ability "${key}"`);
    if (key === ROOT_KEY) {
      throw new BadRequestException("The root ability cannot be revoked");
    }
  }

  /** The player's abilities with what the cascade needs, in claim order. */
  private loadOwned(
    reader: Pick<Db, "select">,
    userId: number,
  ): Promise<(OwnedAbility & { name: string })[]> {
    return reader
      .select({
        key: abilities.key,
        name: abilities.name,
        requires: abilities.requires,
        vialCost: abilities.vialCost,
      })
      .from(userAbilities)
      .innerJoin(abilities, eq(abilities.key, userAbilities.abilityKey))
      .where(eq(userAbilities.userId, userId))
      .orderBy(asc(userAbilities.claimedAt), sql.raw('"user_abilities".rowid'));
  }

  /**
   * What revoking `key` would remove and refund, without changing anything.
   * Uses the same query and the same cascade function as revoke(), so the two
   * can't disagree.
   */
  async previewRevoke(userId: number, key: string): Promise<RevokePreviewResult> {
    await this.assertRevocable(this.db, key);
    const owned = await this.loadOwned(this.db, userId);
    const [u] = await this.db
      .select({ vials: users.vials })
      .from(users)
      .where(eq(users.id, userId));

    const plan = previewRevoke(owned, key);
    const byKey = new Map(owned.map((a) => [a.key, a]));
    const ref = (k: string) => ({ key: k, name: byKey.get(k)!.name });

    return {
      key,
      owned: byKey.has(key),
      removed: plan.removed.map((k) => ({ ...ref(k), vialCost: byKey.get(k)!.vialCost })),
      refund: plan.refund,
      vials: u.vials,
      vialsAfter: u.vials + plan.refund,
      kept: plan.kept.map((k) => ({ ...ref(k.key), via: k.via.map(ref) })),
    };
  }

  /**
   * DM revoke with cascade and refund, in one transaction. Removes the ability
   * plus every ability that depended on it and has no other owned prerequisite,
   * and adds the vial cost of everything removed back to the balance.
   * Revoking something the player doesn't own is a harmless no-op.
   */
  revoke(userId: number, key: string): Promise<RevokeResult> {
    return this.db.transaction(async (tx) => {
      await this.assertRevocable(tx, key);
      const owned = await this.loadOwned(tx, userId);

      const { removed, refund } = computeRevoke(owned, key);

      if (removed.length === 0) {
        const [u] = await tx.select({ vials: users.vials }).from(users).where(eq(users.id, userId));
        return { removed: [], refunded: 0, vials: u.vials };
      }

      await tx
        .delete(userAbilities)
        .where(and(eq(userAbilities.userId, userId), inArray(userAbilities.abilityKey, removed)));
      const [u] = await tx
        .update(users)
        .set({ vials: sql`${users.vials} + ${refund}` })
        .where(eq(users.id, userId))
        .returning({ vials: users.vials });

      return { removed, refunded: refund, vials: u.vials };
    });
  }
}
