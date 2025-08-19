import { useState } from "react";
import PowerDesc from "./PowerDesc";

export default function Power(props) {
  const [info, setInfo] = useState(false);
  const [claim, setClaim] = useState(false);

  function toggleInfo() {
    setInfo((prev) => !prev);
  }

  function toggleClaim() {
    setClaim(true);
  }

  return (
    <>
      <div
        className={
          "bg-stone-900 rounded-full border-3 size-15 hover:cursor-pointer " +
          `${claim ? " border-slate-600" : " border-pink-500"}`
        }
      >
        <img src={props.link} onClick={() => toggleInfo()} />
        {info && (
          <PowerDesc
            link={props.link}
            info={info}
            toggleInfo={toggleInfo}
            claim={claim}
            toggleClaim={toggleClaim}
            name={props.name}
            cost={props.cost}
            charges={props.charges}
            duration={props.duration}
            description={props.description}
            req={props.req}
          />
        )}
      </div>
    </>
  );
}
