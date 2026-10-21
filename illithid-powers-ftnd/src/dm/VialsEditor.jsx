import { useId, useState } from "react";
import {
  btnClass,
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "../components/Modal";

const MAX = 1_000_000;

/** Remount it (via `key`) whenever the player's server balance changes. */
export default function VialsEditor({ vials, onSave }) {
  const id = useId();
  const [value, setValue] = useState(String(vials));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const n = Number(value);
  const valid =
    value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= MAX;
  const step = (delta) =>
    setValue(String(Math.max(0, (valid ? n : vials) + delta)));

  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave(n);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-stone-800 bg-stone-900 p-4">
      <label htmlFor={id} className={labelClass}>
        Available vials
      </label>
      <div className="flex items-center gap-2">
        <button
          className={btnClass + " w-11 px-0"}
          aria-label="One less"
          onClick={() => step(-1)}
        >
          &minus;
        </button>
        <input
          id={id}
          className={inputClass + " text-center text-xl font-bold"}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className={btnClass + " w-11 px-0"}
          aria-label="One more"
          onClick={() => step(1)}
        >
          +
        </button>
      </div>
      <button
        className={btnPrimaryClass + " mt-2.5 w-full"}
        disabled={!valid || n === vials || busy}
        onClick={save}
      >
        Set vials
      </button>
      {!valid && (
        <p role="alert" className="mt-1.5 text-sm text-red-400">
          Enter a whole number from 0 to 1,000,000.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
