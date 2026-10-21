import { useState } from "react";
import ClaimDialog from "./ClaimDialog";
import PowerDesc from "./PowerDesc";

export default function Power(props) {
  const [info, setInfo] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const powerKey = ("" + props.power.name)
    .replaceAll(" ", "")
    .replaceAll("'", "");

  function toggleInfo() {
    setInfo((prev) => !prev);
  }

  return (
    <>
      <div
        className={
          "size-15 rounded-full border-3 bg-stone-900 hover:cursor-pointer " +
          `${
            props.power.cntrl.unlocked
              ? " border-pink-500"
              : " border-slate-600"
          }`
        }
      >
        <img
          className="scale-80"
          src={props.power.imgPath}
          alt={props.power.name}
          onClick={() => toggleInfo()}
        />
        {info && (
          <PowerDesc
            info={info}
            toggleInfo={toggleInfo}
            claim={props.power.cntrl.unlocked}
            handleClaim={() => setConfirming(true)}
            name={props.power.name}
            imgPath={props.power.imgPath}
            desc={props.power.desc}
            cntrl={props.power.cntrl}
            data={props.data}
            powerKey={powerKey}
          />
        )}
      </div>
      {confirming && (
        <ClaimDialog
          power={props.power}
          powerKey={powerKey}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
