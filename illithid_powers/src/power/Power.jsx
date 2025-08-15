import { useState } from "react";
import PowerDesc from "./PowerDesc";

export default function Power(props) {
  const [info, setInfo] = useState(false);
  const [claim, setClaim] = useState(false);

  function toggleInfo() {
    setInfo((prev) => !prev);
  }

  function toggleClaim() {
    setClaim((prev) => !prev);
  }

  return (
    <>
      <div
        className={
          "bg-stone-900 rounded-full border-3 size-15 hover:cursor-pointer " +
          `${claim ? " border-pink-800" : " border-pink-400"}`
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
          />
        )}
      </div>
    </>
  );
}
