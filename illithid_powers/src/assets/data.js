// Base abilities template (all false except IllithidIdentification)
const baseAbilities = {
  IllithidIdentification: true,
  KyarasInfluence: false,
  PsionicOverload: false,
  MentalRejuvenation: false,
  ForcePush: false,
  LuckOfTheFarRealms: false,
  ForceRepel: false,
  PsionicBacklash: false,
  StageFright: false,
  MentalShielding: false,
  DefensiveSwap: false,
  TransfuseHealth: false,
  CullOfTheWeak: false,
  PsionicBeam: false,
  AbsorbIntellect: false,
  PsionicEscape: false,
  BlackHole: false,
  Freecast: false,
  SecondChance: false,
  Enthrall: false,
  ForcefulStrikes: false,
};

// Users list
export const users = [
  {
    username: "Srosu",
    password: "Paladin123",
    abilities: { ...baseAbilities },
  },
  {
    username: "Ximora",
    password: "Rogue123",
    abilities: { ...baseAbilities },
  },
  {
    username: "Ezryn",
    password: "Warlock123",
    abilities: { ...baseAbilities },
  },
  {
    username: "Elk",
    password: "Barbarian123",
    abilities: { ...baseAbilities },
  },
  {
    username: "Mateo",
    password: "Robot123",
    abilities: { ...baseAbilities },
  },
];

export const abilities = [
  // --- Starting Point ---
  {
    // 0
    name: "Illithid Identification",
    cost: "Free Action",
    charges: "Unlimited, must activate",
    duration: "Instantaneous",
    description: "You can identify other tadpole bearers.",
    requirement: null,
  },

  // --- Inner Circle ---
  {
    // 1
    name: "Kyara's Influence",
    cost: "Free Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description: "Add your proficiency bonus to any influence check.",
    requirement: "IllithidIdentification",
  },
  {
    // 2
    name: "Psionic Overload",
    cost: "Bonus Action",
    charges: "Once per short rest",
    duration: "1 minute",
    description:
      "Your attacks deal an additional 1d4 psychic damage, but at the end of each of your turns you also take 1d4 psychic damage.",
    requirement: "IllithidIdentification",
  },
  {
    // 3
    name: "Mental Rejuvenation",
    cost: "Free Action",
    charges: "Equal to proficiency bonus",
    duration: "Instantaneous",
    description: "You restore yourself mentally (effect depends on system).",
    requirement: "IllithidIdentification",
  },
  {
    // 4
    name: "Force Push",
    cost: "Action",
    charges: "Once per short rest",
    duration: "Instantaneous",
    description:
      "Charge forward, pushing all objects and creatures in your path 15 ft away.",
    requirement: "IllithidIdentification",
  },

  // --- Middle Circle ---
  {
    // 5
    name: "Luck Of The Far Realms",
    cost: "Reaction",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "You can add your proficiency bonus to any attack roll or save except death saves.",
    requirement: "KyarasInfluence",
  },
  {
    // 6
    name: "Force Repel",
    cost: "Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "All creatures within 10 ft are pushed back 20 ft and take 2d6 force damage.",
    requirement: "ForcePush",
  },
  {
    // 7
    name: "Psionic Backlash",
    cost: "Reaction",
    charges: "Unlimited",
    duration: "Instantaneous",
    description:
      "When a creature casts a spell, you can deal 1d4 psychic damage to that creature.",
    requirement: "ForcePush or KyarasInfluence",
  },
  {
    // 8
    name: "Stage Fright",
    cost: "Magic Action",
    charges: "Once per short rest",
    duration: "Instantaneous",
    description:
      "Creatures in a 20 ft radius within 60 ft make a Wisdom save or gain disadvantage on attacks and take 2d6 psychic damage per missed attack until they hit you.",
    requirement: "KyarasInfluence or PsionicOverload",
  },
  {
    // 9
    name: "Mental Shielding",
    cost: "Free Action",
    charges: "Equal to proficiency bonus",
    duration: "Instantaneous",
    description:
      "When Mental Rejuvenation is used, also gain 10 temporary hit points.",
    requirement: "MentalRejuvenation",
  },
  {
    // 10
    name: "Defensive Swap",
    cost: "Reaction",
    charges: "Once per short rest",
    duration: "Instantaneous",
    description:
      "Swap places with an ally within 30 ft when they are attacked. That ally regains 2d8 health.",
    requirement: "MentalRejuvenation or ForcePush",
  },
  {
    // 11
    name: "Transfuse Health",
    cost: "Bonus Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description: "Sacrifice up to 50% of your health to heal an ally.",
    requirement: "MentalRejuvenation or PsionicOverload",
  },
  {
    // 12
    name: "Cull Of TheWeak",
    cost: "Togglable Passive",
    charges: "N/A",
    duration: "Instantaneous",
    description:
      "When you attack a creature and their HP ≤ the number of Illithid powers you have unlocked, they die instantly and deal 1d4 psychic damage to nearby enemies.",
    requirement: "PsionicOverload",
  },

  // --- Outer Circle ---
  {
    // 13
    name: "Psionic Beam",
    cost: "Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "100 ft line (5 ft wide) that deals 8d6 psychic damage (half on save) to enemies and heals allies for 8d6.",
    requirement: "TransfuseHealth",
  },
  {
    // 14
    name: "Absorb Intellect",
    cost: "Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "Reduce enemy Intelligence by 1 and heal 4d6 HP. This effect can stack.",
    requirement: "MentalShielding",
  },
  {
    // 15
    name: "Psionic Escape",
    cost: "Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "Teleport up to 100 ft with 1 ally. Creatures near your old spot take 4d6 force damage.",
    requirement: "DefensiveSwap",
  },
  {
    // 16
    name: "Black Hole",
    cost: "Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "Summon a 20 ft radius black hole that pulls creatures in and forces Wisdom saves or Slowed.",
    requirement: "ForceRepel",
  },
  {
    // 17
    name: "Freecast",
    cost: "Passive",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "Your next action or spell costs no spell slots/charges/resources.",
    requirement: "PsionicBacklash",
  },
  {
    // 18
    name: "Second Chance",
    cost: "Free Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description: "You gain one Heroic Inspiration.",
    requirement: "LuckOfTheFarRealms",
  },
  {
    // 19
    name: "Enthrall",
    cost: "Action",
    charges: "Once per long rest",
    duration: "10 minutes",
    description:
      "Target creature makes a Wisdom save or is affected by Dominate Person + Zone of Truth. Future attempts give them advantage.",
    requirement: "StageFright",
  },
  {
    // 20
    name: "Forceful Strikes",
    cost: "Bonus Action",
    charges: "Once per long rest",
    duration: "Instantaneous",
    description:
      "All damage this turn bypasses resistances and converts immunities into resistances.",
    requirement: "CullOfTheWeak",
  },
];
