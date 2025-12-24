function ClaimButton(props) {
  return (
    <button
      className={
        "text-pink-500 absolute bottom-10 mx-[49%] border-2 px-3 py-1 rounded-full w-21 text-center hover:cursor-pointer " +
        `${props.claim ? " bg-neutral-950/50" : undefined}`
      }
      onClick={() => props.handleClaim()}
      disabled={!props.canUnlock || props.claim}
    >
      {props.claim ? "Claimed" : "Claim"}
    </button>
  );
}

export default ClaimButton;
