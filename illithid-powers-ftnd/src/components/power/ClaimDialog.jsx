import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { DataContext } from "../DataContext";
import Modal, {
  btnClass,
  btnPrimaryClass,
  inputClass,
  labelClass,
} from "../Modal";

const vialsWord = (n) => `${n} ${n === 1 ? "vial" : "vials"}`;

/**
 * Asks the player to confirm a claim, in the page rather than a browser pop-up.
 * It's rendered through a portal because the brain sits inside a scaled and
 * translated container, which would misplace anything fixed-position inside it.
 */
export default function ClaimDialog({ power, powerKey, onClose }) {
  const { claimPower, vials } = useContext(DataContext);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const cost = power.cntrl.cost;
  const confirmed = confirm.trim().toLowerCase() === "yes";
  // The server said no (not enough vials, requirements not met): retrying can't help.
  const refused = error && (error.status === 403 || error.status === 404);

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      await claimPower(powerKey);
      onClose();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return createPortal(
    <Modal title={`Claim ${power.name}?`} onClose={onClose}>
      <p className="my-3">
        Costs {vialsWord(cost)}. Balance {vials} &rarr; {vials - cost}. You
        won&apos;t be able to unclaim it.
      </p>
      {!refused && (
        <>
          <label htmlFor="confirm-claim" className={labelClass}>
            Type YES to confirm
          </label>
          <input
            id="confirm-claim"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-red-400">
          {error.message}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2.5">
        <button className={btnClass} onClick={onClose}>
          {refused ? "Close" : "Cancel"}
        </button>
        {!refused && (
          <button
            className={btnPrimaryClass}
            disabled={!confirmed || busy}
            onClick={claim}
          >
            Claim
          </button>
        )}
      </div>
    </Modal>,
    document.body
  );
}
