import Power from "./power/Power";
import { useState, useContext } from "react";
import { DataContext } from "./DataContext";
import Vials from "./Vials/Vials";

import brain from "../assets/photos/brain.png";

function Menu() {
  const { data } = useContext(DataContext);

  return (
    <div className="bg-radial from-red-950 to-black h-screen w-full flex overflow-hidden select-none">
      <img
        className="absolute right-0 left-0 top-0 bottom-0 m-auto scale-200 z-0"
        src={brain}
      />
      <Vials />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-220 w-190 z-1">
        {/* Inner Circle */}
        <div className="relative top-[49%] left-[47%] w-fit">
          <Power power={data.abilities.IllithidIdentification} data={data} />
        </div>
        <div className="relative top-[49%] left-[57%] w-fit">
          <Power power={data.abilities.ForcePush} data={data} />
        </div>
        <div className="relative top-[29%] left-[57%] w-fit">
          <Power power={data.abilities.KyarasInfluence} data={data} />
        </div>
        <div className="relative top-[35.5%] left-[37%] w-fit">
          <Power power={data.abilities.MentalRejuvenation} data={data} />
        </div>
        <div className="relative top-[15.5%] left-[37%] w-fit">
          <Power power={data.abilities.PsionicOverload} data={data} />
        </div>
        {/* Mid Circle */}
        <div className="relative top-[0.5%] left-[27%] w-fit">
          <Power power={data.abilities.CullOfTheWeak} data={data} />
        </div>
        <div className="relative top-[29%] left-[47%] w-fit">
          <Power power={data.abilities.DefensiveSwap} data={data} />
        </div>
        <div className="relative top-[17%] left-[68%] w-fit">
          <Power power={data.abilities.ForceRepel} data={data} />
        </div>
        <div className="relative top-[-20%] left-[68%] w-fit">
          <Power power={data.abilities.LuckOfTheFarRealms} data={data} />
        </div>
        <div className="relative top-[4%] left-[28%] w-fit">
          <Power power={data.abilities.MentalShielding} data={data} />
        </div>
        <div className="relative top-[-19%] left-[73%] w-fit">
          <Power power={data.abilities.PsionicBacklash} data={data} />
        </div>
        <div className="relative top-[-45%] left-[47%] w-fit">
          <Power power={data.abilities.StageFright} data={data} />
        </div>
        <div className="relative top-[-32.8%] left-[22%] w-fit">
          <Power power={data.abilities.TransfuseHealth} data={data} />
        </div>
        {/* Outer Circle */}
        <div className="relative top-[-14%] left-[17%] w-fit">
          <Power power={data.abilities.AbsorbIntellect} data={data} />
        </div>
        <div className="relative top-[-21%] left-[80%] w-fit">
          <Power power={data.abilities.BlackHole} data={data} />
        </div>
        <div className="relative top-[-88%] left-[47%] w-fit">
          <Power power={data.abilities.Enthrall} data={data} />
        </div>
        <div className="relative top-[-84%] left-[15%] w-fit">
          <Power power={data.abilities.ForcefulStrikes} data={data} />
        </div>
        <div className="relative top-[-66.5%] left-[90%] w-fit">
          <Power power={data.abilities.Freecast} data={data} />
        </div>
        <div className="relative top-[-73.5%] left-[6%] w-fit">
          <Power power={data.abilities.PsionicBeam} data={data} />
        </div>
        <div className="relative top-[-43%] left-[47%] w-fit">
          <Power power={data.abilities.PsionicEscape} data={data} />
        </div>
        <div className="relative top-[-112%] left-[82%] w-fit">
          <Power power={data.abilities.SecondChance} data={data} />
        </div>
      </div>
    </div>
  );
}

export default Menu;
