export interface OwnedAbility {
  key: string;
  /** Any-of prerequisites; empty means none. */
  requires: string[];
  vialCost: number;
}

export interface RevokePlan {
  /** The revoked ability first, then everything that cascaded from it. */
  removed: string[];
  /** Sum of the vial costs of everything removed. */
  refund: number;
}

/**
 * Works out what revoking `target` removes from a player's owned abilities.
 *
 * An ability goes with it only if it depended on something being removed AND no
 * other prerequisite of it is still owned (any-of: one surviving prerequisite
 * is enough). Abilities that were already unsupported before this revoke, such
 * as ones the DM granted directly, are left alone: they didn't depend on
 * anything being removed now.
 */
export function computeRevoke(owned: OwnedAbility[], target: string): RevokePlan {
  if (!owned.some((a) => a.key === target)) return { removed: [], refund: 0 };

  const removed = [target];
  const gone = new Set(removed);
  const queue = [target];

  while (queue.length > 0) {
    const justRemoved = queue.shift()!;
    for (const a of owned) {
      if (gone.has(a.key) || !a.requires.includes(justRemoved)) continue;
      // Re-checked every time one of its prerequisites goes, against everything removed so far.
      if (a.requires.some((r) => !gone.has(r) && owned.some((o) => o.key === r))) continue;
      gone.add(a.key);
      removed.push(a.key);
      queue.push(a.key);
    }
  }

  const cost = new Map(owned.map((a) => [a.key, a.vialCost]));
  return { removed, refund: removed.reduce((sum, k) => sum + (cost.get(k) ?? 0), 0) };
}

export interface RevokePreview extends RevokePlan {
  /**
   * Owned abilities that depended on something being removed but survive,
   * with the prerequisites that are still owned and keep them.
   */
  kept: { key: string; via: string[] }[];
}

/** What a revoke would do, without doing it: the plan plus the abilities it spares. */
export function previewRevoke(owned: OwnedAbility[], target: string): RevokePreview {
  const plan = computeRevoke(owned, target);
  const gone = new Set(plan.removed);
  const ownedKeys = new Set(owned.map((a) => a.key));

  const kept: RevokePreview["kept"] = [];
  if (gone.size > 0) {
    for (const a of owned) {
      if (gone.has(a.key) || !a.requires.some((r) => gone.has(r))) continue;
      kept.push({
        key: a.key,
        via: a.requires.filter((r) => ownedKeys.has(r) && !gone.has(r)),
      });
    }
  }
  return { ...plan, kept };
}
