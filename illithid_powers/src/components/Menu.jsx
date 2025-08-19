import Power from "./power/Power";
import { abilities } from "../assets/data";

import brain from "../assets/photos/brain.png";
import illithidIdentification from "../assets/photos/illithid_identification.png";
// Inner Circle
import forcePush from "../assets/photos/inner_circle/Force_Push.png";
import kyaraInflu from "../assets/photos/inner_circle/Kyara_Influence.png";
import mentalRejuv from "../assets/photos/inner_circle/Mental_Rejuvination.png";
import psionicOver from "../assets/photos/inner_circle/Psionic_Overload.png";
// Mid Circle
import cullTheWeak from "../assets/photos/mid_circle/Cull_the_Weak.png";
import defSwap from "../assets/photos/mid_circle/Defensive_Swap.png";
import forceRepel from "../assets/photos/mid_circle/Force_Repel.png";
import luckRealms from "../assets/photos/mid_circle/Luck_of_the_Far_Realms.png";
import mentalShield from "../assets/photos/mid_circle/Mental_Shielding.png";
import psionicBack from "../assets/photos/mid_circle/Psionic_Backlash.png";
import stageFright from "../assets/photos/mid_circle/Stage_Fright.png";
import transHealth from "../assets/photos/mid_circle/Transfuse_Health.png";
// Outer Circle
import absInt from "../assets/photos/outer_circle/Absorb_Intellect.png";
import blackHole from "../assets/photos/outer_circle/Black_Hole.png";
import enthrall from "../assets/photos/outer_circle/Enthrall.png";
import forceStrikes from "../assets/photos/outer_circle/ForcefulStrikes.png";
import freecast from "../assets/photos/outer_circle/Freecast.png";
import psionicBeam from "../assets/photos/outer_circle/Psionic_Beam.png";
import psionicEscape from "../assets/photos/outer_circle/Psionic_Escape.png";
import sndChance from "../assets/photos/outer_circle/Second_Chance.png";

function Menu() {
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
            link={illithidIdentification}
            name={abilities[0].name}
            cost={abilities[0].cost}
            charges={abilities[0].charges}
            duration={abilities[0].duration}
            description={abilities[0].description}
            req={abilities[0].requirement}
          />
        </div>
        <div className="relative top-[49%] left-[57%] w-fit">
          <Power
            link={forcePush}
            name={abilities[4].name}
            cost={abilities[4].cost}
            charges={abilities[4].charges}
            duration={abilities[4].duration}
            description={abilities[4].description}
            req={abilities[4].requirement}
          />
        </div>
        <div className="relative top-[29%] left-[57%] w-fit">
          <Power
            link={kyaraInflu}
            name={abilities[1].name}
            cost={abilities[1].cost}
            charges={abilities[1].charges}
            duration={abilities[1].duration}
            description={abilities[1].description}
            req={abilities[1].requirement}
          />
        </div>
        <div className="relative top-[35.5%] left-[37%] w-fit">
          <Power
            link={mentalRejuv}
            name={abilities[3].name}
            cost={abilities[3].cost}
            charges={abilities[3].charges}
            duration={abilities[3].duration}
            description={abilities[3].description}
            req={abilities[3].requirement}
          />
        </div>
        <div className="relative top-[15.5%] left-[37%] w-fit">
          <Power
            link={psionicOver}
            name={abilities[2].name}
            cost={abilities[2].cost}
            charges={abilities[2].charges}
            duration={abilities[2].duration}
            description={abilities[2].description}
            req={abilities[2].requirement}
          />
        </div>
        {/* Mid Circle */}
        <div className="relative top-[0.5%] left-[27%] w-fit">
          <Power
            link={cullTheWeak}
            name={abilities[12].name}
            cost={abilities[12].cost}
            charges={abilities[12].charges}
            duration={abilities[12].duration}
            description={abilities[12].description}
            req={abilities[12].requirement}
          />
        </div>
        <div className="relative top-[29%] left-[47%] w-fit">
          <Power
            link={defSwap}
            name={abilities[10].name}
            cost={abilities[10].cost}
            charges={abilities[10].charges}
            duration={abilities[10].duration}
            description={abilities[10].description}
            req={abilities[10].requirement}
          />
        </div>
        <div className="relative top-[17%] left-[68%] w-fit">
          <Power
            link={forceRepel}
            name={abilities[6].name}
            cost={abilities[6].cost}
            charges={abilities[6].charges}
            duration={abilities[6].duration}
            description={abilities[6].description}
            req={abilities[6].requirement}
          />
        </div>
        <div className="relative top-[-20%] left-[68%] w-fit">
          <Power
            link={luckRealms}
            name={abilities[5].name}
            cost={abilities[5].cost}
            charges={abilities[5].charges}
            duration={abilities[5].duration}
            description={abilities[5].description}
            req={abilities[5].requirement}
          />
        </div>
        <div className="relative top-[4%] left-[28%] w-fit">
          <Power
            link={mentalShield}
            name={abilities[9].name}
            cost={abilities[9].cost}
            charges={abilities[9].charges}
            duration={abilities[9].duration}
            description={abilities[9].description}
            req={abilities[9].requirement}
          />
        </div>
        <div className="relative top-[-19%] left-[73%] w-fit">
          <Power
            link={psionicBack}
            name={abilities[7].name}
            cost={abilities[7].cost}
            charges={abilities[7].charges}
            duration={abilities[7].duration}
            description={abilities[7].description}
            req={abilities[7].requirement}
          />
        </div>
        <div className="relative top-[-45%] left-[47%] w-fit">
          <Power
            link={stageFright}
            name={abilities[8].name}
            cost={abilities[8].cost}
            charges={abilities[8].charges}
            duration={abilities[8].duration}
            description={abilities[8].description}
            req={abilities[8].requirement}
          />
        </div>
        <div className="relative top-[-32.8%] left-[22%] w-fit">
          <Power
            link={transHealth}
            name={abilities[11].name}
            cost={abilities[11].cost}
            charges={abilities[11].charges}
            duration={abilities[11].duration}
            description={abilities[11].description}
            req={abilities[11].requirement}
          />
        </div>
        {/* Outer Circle */}
        <div className="relative top-[-14%] left-[17%] w-fit">
          <Power
            link={absInt}
            name={abilities[14].name}
            cost={abilities[14].cost}
            charges={abilities[14].charges}
            duration={abilities[14].duration}
            description={abilities[14].description}
            req={abilities[14].requirement}
          />
        </div>
        <div className="relative top-[-21%] left-[80%] w-fit">
          <Power
            link={blackHole}
            name={abilities[16].name}
            cost={abilities[16].cost}
            charges={abilities[16].charges}
            duration={abilities[16].duration}
            description={abilities[16].description}
            req={abilities[16].requirement}
          />
        </div>
        <div className="relative top-[-88%] left-[47%] w-fit">
          <Power
            link={enthrall}
            name={abilities[19].name}
            cost={abilities[19].cost}
            charges={abilities[19].charges}
            duration={abilities[19].duration}
            description={abilities[19].description}
            req={abilities[19].requirement}
          />
        </div>
        <div className="relative top-[-84%] left-[15%] w-fit">
          <Power
            link={forceStrikes}
            name={abilities[20].name}
            cost={abilities[20].cost}
            charges={abilities[20].charges}
            duration={abilities[20].duration}
            description={abilities[20].description}
            req={abilities[20].requirement}
          />
        </div>
        <div className="relative top-[-66.5%] left-[90%] w-fit">
          <Power
            link={freecast}
            name={abilities[17].name}
            cost={abilities[17].cost}
            charges={abilities[17].charges}
            duration={abilities[17].duration}
            description={abilities[17].description}
            req={abilities[17].requirement}
          />
        </div>
        <div className="relative top-[-73.5%] left-[6%] w-fit">
          <Power
            link={psionicBeam}
            name={abilities[13].name}
            cost={abilities[13].cost}
            charges={abilities[13].charges}
            duration={abilities[13].duration}
            description={abilities[13].description}
            req={abilities[13].requirement}
          />
        </div>
        <div className="relative top-[-43%] left-[47%] w-fit">
          <Power
            link={psionicEscape}
            name={abilities[15].name}
            cost={abilities[15].cost}
            charges={abilities[15].charges}
            duration={abilities[15].duration}
            description={abilities[15].description}
            req={abilities[15].requirement}
          />
        </div>
        <div className="relative top-[-112%] left-[82%] w-fit">
          <Power
            link={sndChance}
            name={abilities[18].name}
            cost={abilities[18].cost}
            charges={abilities[18].charges}
            duration={abilities[18].duration}
            description={abilities[18].description}
            req={abilities[18].requirement}
          />
        </div>
      </div>
    </div>
  );
}

export default Menu;
