import { describe, expect, it } from "vitest";
import { buildData } from "./buildData";
import { isUnlockable } from "./data";

const catalog = [
  {
    key: "IllithidIdentification",
    name: "Illithid Identification",
    description: "root",
    vialCost: 0,
    requires: [],
  },
  {
    key: "ForcePush",
    name: "Force Push",
    description: "push",
    vialCost: 1,
    requires: ["IllithidIdentification"],
  },
  {
    key: "KyarasInfluence",
    name: "Kyara's Influence",
    description: "kyara",
    vialCost: 1,
    requires: ["IllithidIdentification"],
  },
  {
    key: "PsionicBacklash",
    name: "Psionic Backlash",
    description: "backlash",
    vialCost: 2,
    requires: ["ForcePush", "KyarasInfluence"],
  },
  {
    key: "ForceRepel",
    name: "Force Repel",
    description: "repel",
    vialCost: 2,
    requires: ["ForcePush"],
  },
];
const images = { ForcePush: "/force.png" };

describe("buildData", () => {
  it("produces the shape the components already use", () => {
    const data = buildData(catalog, ["IllithidIdentification"], 3, images);
    expect(data.resources).toEqual({ vials: 3 });
    expect(data.abilities.ForcePush).toEqual({
      name: "Force Push",
      imgPath: "/force.png",
      desc: "push",
      cntrl: { req: "Illithid Identification", cost: 1, unlocked: false },
    });
  });

  it("marks claimed abilities unlocked", () => {
    const data = buildData(
      catalog,
      ["IllithidIdentification", "ForcePush"],
      0,
      images
    );
    expect(data.abilities.ForcePush.cntrl.unlocked).toBe(true);
    expect(data.abilities.KyarasInfluence.cntrl.unlocked).toBe(false);
  });

  it("writes any-of requirements as display names joined by 'or'", () => {
    const data = buildData(catalog, [], 0, images);
    expect(data.abilities.PsionicBacklash.cntrl.req).toBe(
      "Force Push or Kyara's Influence"
    );
  });

  it("uses the 'Illithid Tadpole' sentinel for abilities with no prerequisite", () => {
    const data = buildData(catalog, [], 0, images);
    expect(data.abilities.IllithidIdentification.cntrl.req).toBe(
      "Illithid Tadpole"
    );
  });

  it("feeds the existing isUnlockable() button logic correctly", () => {
    const owned = ["IllithidIdentification", "KyarasInfluence"];
    const rich = buildData(catalog, owned, 5, images);
    expect(isUnlockable("KyarasInfluence", rich)).toBe(0); // claimed
    expect(isUnlockable("ForcePush", rich)).toBe(1); // claimable
    expect(isUnlockable("PsionicBacklash", rich)).toBe(1); // any-of satisfied via Kyara
    expect(isUnlockable("ForceRepel", rich)).toBe(2); // needs Force Push
    const poor = buildData(catalog, owned, 1, images);
    expect(isUnlockable("PsionicBacklash", poor)).toBe(3); // costs 2, has 1
  });
});
