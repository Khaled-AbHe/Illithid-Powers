import Power from "./power/Power";
import { mindData } from "../assets/data";
import { useState, useEffect } from "react";

import brain from "../assets/photos/brain.png";

function Menu() {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem("psionicData");
    return savedData
      ? JSON.parse(localStorage.getItem("psionicData"))
      : mindData;
  });

  useEffect(() => {
    data && localStorage.setItem("psionicData", JSON.stringify(data));
  }, [data]);

  function unlockPower(powerKey) {
    setData((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [powerKey]: {
          ...prev.abilities[powerKey],
          cntrl: {
            ...prev.abilities[powerKey].cntrl,
            unlocked: true,
          },
        },
      },
    }));
  }

  return (
    <div className="bg-radial from-red-950 to-black h-[925px] w-full flex overflow-hidden select-none">
      <img
        className="absolute right-0 left-0 top-0 bottom-0 m-auto scale-200 z-0"
        src={brain}
      />
      <div className="right-0 left-0 m-auto h-220 w-190 z-1">
        {/* Inner Circle */}
        <div className="relative top-[49%] left-[47%] w-fit">
          <Power
            power={data.abilities.IllithidIdentification}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[49%] left-[57%] w-fit">
          <Power
            power={data.abilities.ForcePush}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[29%] left-[57%] w-fit">
          <Power
            power={data.abilities.KyarasInfluence}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[35.5%] left-[37%] w-fit">
          <Power
            power={data.abilities.MentalRejuvenation}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[15.5%] left-[37%] w-fit">
          <Power
            power={data.abilities.PsionicOverload}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        {/* Mid Circle */}
        <div className="relative top-[0.5%] left-[27%] w-fit">
          <Power
            power={data.abilities.CullOfTheWeak}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[29%] left-[47%] w-fit">
          <Power
            power={data.abilities.DefensiveSwap}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[17%] left-[68%] w-fit">
          <Power
            power={data.abilities.ForceRepel}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-20%] left-[68%] w-fit">
          <Power
            power={data.abilities.LuckOfTheFarRealms}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[4%] left-[28%] w-fit">
          <Power
            power={data.abilities.MentalShielding}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-19%] left-[73%] w-fit">
          <Power
            power={data.abilities.PsionicBacklash}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-45%] left-[47%] w-fit">
          <Power
            power={data.abilities.StageFright}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-32.8%] left-[22%] w-fit">
          <Power
            power={data.abilities.TransfuseHealth}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        {/* Outer Circle */}
        <div className="relative top-[-14%] left-[17%] w-fit">
          <Power
            power={data.abilities.AbsorbIntellect}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-21%] left-[80%] w-fit">
          <Power
            power={data.abilities.BlackHole}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-88%] left-[47%] w-fit">
          <Power
            power={data.abilities.Enthrall}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-84%] left-[15%] w-fit">
          <Power
            power={data.abilities.ForcefulStrikes}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-66.5%] left-[90%] w-fit">
          <Power
            power={data.abilities.Freecast}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-73.5%] left-[6%] w-fit">
          <Power
            power={data.abilities.PsionicBeam}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-43%] left-[47%] w-fit">
          <Power
            power={data.abilities.PsionicEscape}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
        <div className="relative top-[-112%] left-[82%] w-fit">
          <Power
            power={data.abilities.SecondChance}
            unlockPower={unlockPower}
            allAbilities={data.abilities}
          />
        </div>
      </div>
    </div>
  );
}

export default Menu;
