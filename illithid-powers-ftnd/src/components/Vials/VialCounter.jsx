// Read-only: only the DM can change a player's vials.
function VialCounter(props) {
  return (
    <div className="flex flex-col content-center justify-center">
      <p
        data-testid="vial-count"
        className="m-0 w-8 text-center text-2xl font-bold text-purple-500"
      >
        {props.vials}
      </p>
    </div>
  );
}

export default VialCounter;
