import { useState } from "react";
import { btnClass, btnDangerClass, hintClass } from "../components/Modal";
import { orList, plural } from "./util";

const ROOT_KEY = "IllithidIdentification";

export default function PowerPanel({
  player,
  power,
  byKey,
  onGrant,
  onRevoke,
}) {
  const claimed = !!power && player.claimed.includes(power.key);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!power) {
    return (
      <section className="rounded-2xl border-2 border-dashed border-stone-700 p-4">
        <p className={hintClass + " mt-0"}>
          Select a power on the brain to grant or revoke it.
        </p>
      </section>
    );
  }

  const requires = power.requires.map((k) => byKey[k]?.name ?? k);
  const requirementMet =
    power.requires.length === 0 ||
    power.requires.some((k) => player.claimed.includes(k));
  const short = power.vialCost - player.vials;

  async function grant() {
    setBusy(true);
    setError("");
    try {
      await onGrant(power.key);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-stone-800 bg-stone-900 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold text-pink-300">{power.name}</h3>
      </div>
      <p className={hintClass}>
        Cost {plural(power.vialCost, "vial")}.{" "}
        {requires.length ? `Requires ${orList(requires)}.` : "No prerequisite."}
      </p>
      <p className="mt-2 overflow-y-auto text-sm text-stone-300">
        {power.description}
      </p>

      {claimed && power.key === ROOT_KEY && (
        <p className={hintClass}>
          Every player owns this one. It can't be revoked.
        </p>
      )}

      {claimed && power.key !== ROOT_KEY && (
        <>
          <button
            className={btnDangerClass + " mt-2 w-full"}
            onClick={onRevoke}
          >
            Revoke
          </button>
        </>
      )}

      {!claimed && (
        <>
          <button
            className={btnClass + " mt-3 w-full"}
            disabled={!requirementMet || short > 0 || busy}
            onClick={grant}
          >
            Grant {power.name}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
