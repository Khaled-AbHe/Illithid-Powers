import { useContext, useState } from "react";
import PowerDesc from "./PowerDesc";
import { DataContext } from "../DataContext";

export default function Power(props) {
  const [info, setInfo] = useState(false);
  const { unlockPower, decrease } = useContext(DataContext);

  const powerKey = ("" + props.power.name)
    .replaceAll(" ", "")
    .replaceAll("'", "");

  function toggleInfo() {
    setInfo((prev) => !prev);
  }

  function handleClaim() {
    const cost = props.power.cntrl.cost;
    decrease(cost);
    unlockPower(powerKey);
  }

  return (
    <>
      <div
        className={
          "bg-stone-900 rounded-full border-3 size-15 hover:cursor-pointer " +
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
          onClick={() => toggleInfo()}
        />
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
            data={props.data}
            powerKey={powerKey}
          />
        )}
      </div>
    </>
  );
}
