export const mindData = {
  resources: {
    vials: 0,
  },
  abilities: {
    IllithidIdentification: {
      name: "Illithid Identification",
      imgPath: "/src/assets/photos/illithid_identification.png",
      desc: "As a Bonus action, you can identify those who are connected to Kyara herself. When you activate this ability, psionic strands will be revealed to you, and they will attach themselves to other tadpole bearers. You must use your Bonus action on subsequent turns to keep the strands from disappearing.",
      cntrl: {
        req: "Illithid Tadpole",
        cost: 0,
        unlocked: true,
      },
    },
    // inner
    KyarasInfluence: {
      name: "Kyara's Influence",
      imgPath: "/src/assets/photos/inner_circle/Kyara_Influence.png",
      desc: "Kyara's voice is allusive. When you take the Influence action, you can add your Proficiency bonus on the result of the roll. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Illithid Identification",
        cost: 1,
        unlocked: false,
      },
    },
    PsionicOverload: {
      name: "Psionic Overload",
      imgPath: "/src/assets/photos/inner_circle/Psionic_Overload.png",
      desc: "As a Bonus action, you can push your mind to its very limits to bolster your power for 1 minute. When you do so, you deal an additional 1d4 Psychic damage each time you make a damage roll at the cost of taking 1d4 Psychic damage at the end of each of your turns. Once you use this ability, you can't do so again until you finish a Short or Long rest.",
      cntrl: {
        req: "Illithid Identification",
        cost: 1,
        unlocked: false,
      },
    },
    MentalRejuvenation: {
      name: "Mental Rejuvenation",
      imgPath: "/src/assets/photos/inner_circle/Mental_Rejuvenation.png",
      desc: "Your mind can reinforce your body further as it recovers. Whenever you regain Hit Points, you can choose to gain 10 Temporary Hit Points an amount of times equal to your Proficiency bonus. You regain all expended charges when you finish a Long rest.",
      cntrl: {
        req: "Illithid Identification",
        cost: 1,
        unlocked: false,
      },
    },
    ForcePush: {
      name: "Force Push",
      imgPath: "/src/assets/photos/inner_circle/Psionic_Overload.png",
      desc: "As a Magic action, you can charge forward 10 feet and knock back all enemies in your path 15 feet away. Once you use this ability, you can't do so again until you finish a Short or Long rest.",
      cntrl: {
        req: "Illithid Identification",
        cost: 1,
        unlocked: false,
      },
    },
    // middle
    LuckOfTheFarRealms: {
      name: "Luck Of The Far Realms",
      imgPath: "/src/assets/photos/mid_circle/Luck_of_the_Far_Realms.png",
      desc: "Kyara tips the scales to your favor. When you miss an attack roll or fail a saving throw you can add your proficiency bonus to the roll as a Reaction, potentially turning the failed roll into a successful one. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Kyara's Influence",
        cost: 2,
        unlocked: false,
      },
    },
    ForceRepel: {
      name: "Force Repel",
      imgPath: "/src/assets/photos/mid_circle/Force_Repel.png",
      desc: "As a Magic action, you can push all creatures away from you. When you do so, all creatures must make a Strength saving throw against your Spell save DC. On a failed save, the creature is pushed back 30 feet and takes 4d6 Force damage. On a successful save, the creature takes half as much damage. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Force Push",
        cost: 2,
        unlocked: false,
      },
    },
    PsionicBacklash: {
      name: "Psionic Backlash",
      imgPath: "/src/assets/photos/mid_circle/Psionic_Backlash.png",
      desc: "Whenever a creature casts a spell, you can roll a number of d6s equal to the spell's level and deal Psychic damage equal to the amount rolled.",
      cntrl: {
        req: "Force Push or Kyara's Influence",
        cost: 2,
        unlocked: false,
      },
    },
    StageFright: {
      name: "Stage Fright",
      imgPath: "/src/assets/photos/mid_circle/Stage_Fright.png",
      desc: "As a Magic Action, you can choose a point within 60 feet of you to conjure Kyara's intimidating presence. Each creature in a 20-foot-radius Sphere centered on that point makes a Wisdom saving throw against your Spell save DC or have Disadvantage on attack rolls and take 2d6 Psychic damage each time they miss. Once you use this ability, you can't do so again until you finish a Short or Long rest.",
      cntrl: {
        req: "Kyara's Influence or Psionic Overload",
        cost: 2,
        unlocked: false,
      },
    },
    MentalShielding: {
      name: "Mental Shielding",
      imgPath: "/src/assets/photos/mid_circle/Mental_Shielding.png",
      desc: "The Temporary Hit Points you gain from Mental Rejuvenation increases to 20.",
      cntrl: {
        req: "Mental Rejuvenation",
        cost: 2,
        unlocked: false,
      },
    },
    DefensiveSwap: {
      name: "Defensive Swap",
      imgPath: "/src/assets/photos/mid_circle/Defensive_Swap.png",
      desc: "Whenever an ally within 30 feet of you gets hit by an attack, you can use your Reaction to swap places with them to take the hit for them. The ally also regains 2d8 hit points. Once you use this ability, you can't do so again until you finish a Short or Long rest.",
      cntrl: {
        req: "Mental Rejuvenation or Force Push",
        cost: 2,
        unlocked: false,
      },
    },
    TransfuseHealth: {
      name: "Transfuse Health",
      imgPath: "/src/assets/photos/mid_circle/Transfuse_Health.png",
      desc: "As a Magic action, you can expend up to 50% of your current Hit Points to heal a creature you can touch. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Mental Rejuvenation or Psionic Overload",
        cost: 2,
        unlocked: false,
      },
    },
    CullOfTheWeak: {
      name: "Cull Of The Weak",
      imgPath: "/src/assets/photos/mid_circle/Cull_the_Weak.png",
      desc: "Kyara makes sure your enemies fall when they're at their weakest. Whenever you hit a target, if the remaining Hit Points they have after taking damage is equal or less than the amount of Illithid powers you have unlocked, they die instantly and creatures within 10 feet of it takes 1d4 Psychic damage.",
      cntrl: {
        req: "Psionic Overload",
        cost: 2,
        unlocked: false,
      },
    },
    // outer
    PsionicBeam: {
      name: "Psionic Beam",
      imgPath: "/src/assets/photos/outer_circle/Psionic_Beam.png",
      desc: "As a Magic action, you can unleash a 100-foot-long, 5-foot-wide psychic beam in a direction you choose. Each creature in the Line makes an Intelligence saving throw against your Spell save DC, taking 8d6 Psychic damage on a failed save or half as much damage on a successful one. Additionally, allies within the Line regains 8d6 Hit Points. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Transfuse Health",
        cost: 3,
        unlocked: false,
      },
    },
    AbsorbIntellect: {
      name: "Absorb Intellect",
      imgPath: "/src/assets/photos/outer_circle/Absorb_Intellect.png",
      desc: "As a Magic action, you can absorb the intelligence of a creature you can touch. The target makes an Intelligence saving throw against your Spell Save DC or its Intelligence score gets reduced by 2 for an hour, and you regain 4d6 Hit Points. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Mental Shielding",
        cost: 3,
        unlocked: false,
      },
    },
    PsionicEscape: {
      name: "Psionic Escape",
      imgPath: "/src/assets/photos/outer_circle/Psionic_Escape.png",
      desc: "As a Magic action, you and a willing creature you touch teleport in a location within 100 feet of you. Creatures within 10 feet of you before you teleport makes a Constitution saving throw, taking 4d6 Force damage on a failed save or half as much on a successful one. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Defensive Swap",
        cost: 3,
        unlocked: false,
      },
    },
    BlackHole: {
      name: "Black Hole",
      imgPath: "/src/assets/photos/outer_circle/Black_Hole.png",
      desc: "As a Magic action, you can conjure a black hole within 60 feet of you. Creatures within 20 feet of the black hole gets pulled 20 feet towards it and makes an Intelligence saving throw against your Spell save DC. On a failed save, the creature is under the effects of the Slow spell until the end of your next turn. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Force Repel",
        cost: 3,
        unlocked: false,
      },
    },
    Freecast: {
      name: "Freecast",
      imgPath: "/src/assets/photos/outer_circle/Freecast.png",
      desc: "You have discovered a marvelous adaptability within yourself. Spell slots, charges, and similar resource costs for your next action or spell are removed. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Psionic Backlash",
        cost: 3,
        unlocked: false,
      },
    },
    SecondChance: {
      name: "Second Chance",
      imgPath: "/src/assets/photos/outer_circle/Second_Chance.png",
      desc: "Whenever you fail a d20 test, you can reroll it and use the new roll. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Luck Of The Far Realms",
        cost: 3,
        unlocked: false,
      },
    },
    Enthrall: {
      name: "Enthrall",
      imgPath: "/src/assets/photos/outer_circle/Enthrall.png",
      desc: "As a Magic action, you can subjugate a creature under your control. A creature you can touch makes a Wisdom saving throw or be under the effects of the Dominate Person spell and Zone of Truth spell for 10 minutes. Once the effect wears off, all future saving throws they make to resist this ability is made with Advantage. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Stage Fright",
        cost: 3,
        unlocked: false,
      },
    },
    ForcefulStrikes: {
      name: "Forceful Strikes",
      imgPath: "/src/assets/photos/outer_circle/ForcefulStrikes.png",
      desc: "As a Bonus action, you can make your attacks deal True damage. When you use this ability, all damage you deal turn bypasses resistances and converts immunities into resistances for 1 turn. Once you use this ability, you can't do so again until you finish a Long rest.",
      cntrl: {
        req: "Cull Of The Weak",
        cost: 3,
        unlocked: false,
      },
    },
  },
};

// Helper function to check if a power is unlockable
export function isUnlockable(powerKey, data) {
  const power = data.abilities[powerKey];
  const vials = data.resources["vials"];

  if (power.cntrl.unlocked === true) return 0;

  // No requirement = always unlockable
  if (power.cntrl.req === "Illithid Tadpole") return 1;

  // Parse "or" requirements
  const requirements = power.cntrl.req
    .split(" or ")
    .map((r) => r.trim().replaceAll(" ", "").replaceAll("'", ""));

  // Check if ANY requirement is met (for "or" logic)
  let hasReq = requirements.some(
    (reqName) => data.abilities[reqName]?.cntrl.unlocked
  )
    ? 1
    : 2;

  return checkVials(hasReq, power, vials);
}

function checkVials(hasReq, power, vials) {
  if (hasReq == 2) {
    return 2;
  } else if (hasReq == 1) {
    // Check if required cost is met
    if (power.cntrl.cost > vials) {
      return 3;
    }
    return 1;
  }
}
