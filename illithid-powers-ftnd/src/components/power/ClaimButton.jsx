// What each canUnlock status (from isUnlockable) looks like.
const BUTTONS = {
  0: {
    text: "Claimed",
    access: true,
    style: "text-pink-700 w-21 cursor-default ",
  },
  1: {
    text: "Claim",
    access: false,
    style: "text-pink-500 w-21 cursor-pointer ",
  },
  2: {
    text: "Missing Requirements!",
    access: true,
    style: "text-red-500 w-50 cursor-not-allowed ",
  },
  3: {
    text: "Not Enough Vials!",
    access: true,
    style: "text-red-500 w-50 cursor-not-allowed ",
  },
};

function ClaimButton(props) {
  const btn = BUTTONS[props.canUnlock];

  return (
    <div className="absolute bottom-0 flex h-20 w-full justify-center">
      <button
        className={
          `${btn.style}` +
          "absolute bottom-10 mx-[49%] rounded-full border-2 px-3 py-1 text-center"
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
