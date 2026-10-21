export default function DmPower({ power, claimed, selected, onSelect }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={
        "block size-15 cursor-pointer rounded-full border-3 bg-stone-900 " +
        (claimed ? "border-pink-500" : "border-slate-600") +
        (selected ? " ring-4 ring-pink-500/40" : "")
      }
    >
      <img className="scale-80" src={power.imgPath} alt={power.name} />
    </button>
  );
}
