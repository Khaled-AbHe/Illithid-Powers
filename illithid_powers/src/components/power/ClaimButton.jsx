import { useState, useEffect } from "react";

function ClaimButton(props) {
  const [btn, setBtn] = useState({
    text: null,
    access: null,
    style: null,
  });

  function setButton(nb) {
    if (nb === 0) {
      setBtn(() => ({
        text: "Claimed",
        access: true,
        style: "text-pink-700 w-21 cursor-default ",
      }));
    } else if (nb === 1) {
      setBtn(() => ({
        text: "Claim",
        access: false,
        style: "text-pink-500 w-21 cursor-pointer ",
      }));
    } else if (nb === 2) {
      setBtn(() => ({
        text: "Missing Requirements!",
        access: true,
        style: "text-red-500 w-50 cursor-not-allowed ",
      }));
    } else if (nb === 3) {
      setBtn(() => ({
        text: "Not Enough Vials!",
        access: true,
        style: "text-red-500 w-50 cursor-not-allowed ",
      }));
    }
  }

  useEffect(() => {
    setButton(props.canUnlock);
  }, [btn]);

  return (
    <div className="absolute flex justify-center h-20 w-full bottom-0">
      <button
        className={
          `${btn.style}` +
          "absolute bottom-10 mx-[49%] border-2 px-3 py-1 rounded-full text-center"
        }
        onClick={() => {
          props.handleClaim();
        }}
        disabled={btn.access || props.claim}
      >
        {btn.text}
      </button>
    </div>
  );
}

export default ClaimButton;
