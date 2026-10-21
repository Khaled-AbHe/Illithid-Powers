import { plural } from "./util";

export default function PlayerList({ players, selectedId, total, onSelect }) {
  return (
    <aside
      aria-label="Players"
      className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r-2 border-stone-800 p-5"
    >
      <h2 className="text-2xl font-bold text-pink-300">Players</h2>
      {players.map((p) => {
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            aria-current={selected ? "true" : undefined}
            onClick={() => onSelect(p.id)}
            className={
              "cursor-pointer rounded-2xl border-2 bg-stone-900 p-4 text-left " +
              (selected
                ? "border-pink-500"
                : "border-stone-800 hover:border-stone-600")
            }
          >
            <span className="flex items-center justify-between gap-2">
              <strong className="text-lg">{p.username}</strong>
              <span className="rounded-full border-2 border-purple-700 px-2.5 py-0.5 text-sm font-bold text-purple-300">
                {plural(p.vials, "vial")}
              </span>
            </span>
            <span className="mt-1 block text-sm text-stone-400">
              {p.claimed.length} / {total} powers
            </span>
          </button>
        );
      })}
    </aside>
  );
}
