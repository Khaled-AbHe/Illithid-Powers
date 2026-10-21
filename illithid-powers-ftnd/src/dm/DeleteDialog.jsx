import { useState } from "react";
import { api } from "../api/client";
import Modal, {
  btnClass,
  btnDangerFillClass,
  inputClass,
  labelClass,
} from "../components/Modal";
import { plural } from "./util";

/** Permanent: asks for YES. A player who is already gone counts as deleted. */
export default function DeleteDialog({ player, onClose, onDone }) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Every player owns the free root power, so it isn't counted as something lost.
  const powers = Math.max(0, player.claimed.length - 1);
  const confirmed = confirm.trim().toLowerCase() === "yes";

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.delete(`/dm/players/${player.id}`);
      onDone({ alreadyGone: false });
    } catch (err) {
      if (err.status === 404) {
        onDone({ alreadyGone: true });
        return;
      }
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Delete ${player.username}?`} danger onClose={onClose}>
      <p className="my-3">
        Permanently removes {player.username}&apos;s account,{" "}
        <strong>{plural(powers, "power")}</strong> and{" "}
        <strong>{plural(player.vials, "vial")}</strong>.{" "}
        {/* Cleanup (kept in case you change your mind): {player.username} is signed out right away. */}
        This can&apos;t be undone.
      </p>
      <label htmlFor="confirm-delete" className={labelClass}>
        Type YES to confirm
      </label>
      <input
        id="confirm-delete"
        className={inputClass + " border-red-500"}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      {error && (
        <p role="alert" className="mt-3 text-red-400">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2.5">
        <button className={btnClass} onClick={onClose}>
          Cancel
        </button>
        <button
          className={btnDangerFillClass}
          disabled={!confirmed || busy}
          onClick={remove}
        >
          Delete player
        </button>
      </div>
    </Modal>
  );
}
