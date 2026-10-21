import { useState } from "react";
import { api } from "../api/client";
import Modal, {
  btnClass,
  btnPrimaryClass,
  hintClass,
  inputClass,
  labelClass,
} from "../components/Modal";

export default function RenameDialog({ player, onClose, onDone }) {
  const [username, setUsername] = useState(player.username);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const trimmed = username.trim();
  const changed = trimmed !== "" && trimmed !== player.username;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onDone(
        await api.patch(`/dm/players/${player.id}`, { username: trimmed })
      );
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Rename ${player.username}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mt-4">
          <label htmlFor="rename-username" className={labelClass}>
            New name
          </label>
          <input
            id="rename-username"
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <p className={hintClass}>Their login name changes right away.</p>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-red-400">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className={btnClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={btnPrimaryClass}
            disabled={!changed || busy}
          >
            Save name
          </button>
        </div>
      </form>
    </Modal>
  );
}
