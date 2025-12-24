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
    let ans = prompt(
      `Are you sure you want to claim ${props.power.name} for ${cost} ${
        cost > 1 ? "vials" : "vial"
      }?. You will not be able to unclaim it after it is claimed. (Type 'YES' to proceed)`
    );
    if (ans.toLowerCase().trim() == "yes") {
      decrease(cost);
      unlockPower(powerKey);
    }
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
