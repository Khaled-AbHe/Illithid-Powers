import { useState } from "react";
import PowerDesc from "./PowerDesc";

export default function Power(props) {
  const [info, setInfo] = useState(false);
  const powerKey = ("" + props.power.name)
    .replaceAll(" ", "")
    .replaceAll("'", "");
  function toggleInfo() {
    setInfo((prev) => !prev);
  }

  function handleClaim() {
    props.unlockPower(powerKey);
  }

  return (
    <>
      <div
        className={
          "bg-stone-900 rounded-full border-3 size-15 hover:cursor-pointer " +
          `${
            props.power.cntrl.unlocked
              ? " border-slate-600"
              : " border-pink-500"
          }`
        }
      >
        <img src={props.power.imgPath} onClick={() => toggleInfo()} />
        {info && (
          <PowerDesc
            info={info}
            toggleInfo={toggleInfo}
            claim={props.power.cntrl.unlocked}
            handleClaim={handleClaim}
            name={props.power.name}
            imgPath={props.power.imgPath}
            desc={props.power.desc}
            cntrl={props.power.cntrl}
            allAbilities={props.allAbilities}
            powerKey={powerKey}
          />
        )}
      </div>
    </>
  );
}
