/**
 * Turns the API responses into the shape every component already uses:
 *   { resources: { vials }, abilities: { [key]: { name, imgPath, desc, cntrl: { req, cost, unlocked } } } }
 *
 * `req` is the display string ("Force Push or Kyara's Influence"). Abilities with
 * no prerequisite use "Illithid Tadpole", which isUnlockable() treats as "none".
 */
export function buildData(catalog, claimedKeys, vials, images = {}) {
  const names = Object.fromEntries(catalog.map((a) => [a.key, a.name]));
  const claimed = new Set(claimedKeys);

  const abilities = {};
  for (const a of catalog) {
    abilities[a.key] = {
      name: a.name,
      imgPath: images[a.key],
      desc: a.description,
      cntrl: {
        req: a.requires.length
          ? a.requires.map((k) => names[k] ?? k).join(" or ")
          : "Illithid Tadpole",
        cost: a.vialCost,
        unlocked: claimed.has(a.key),
      },
    };
  }
  return { resources: { vials }, abilities };
}
