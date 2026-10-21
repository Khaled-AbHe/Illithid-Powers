import { useState } from "react";
import { api } from "../api/client";
import Modal, {
  btnClass,
  btnPrimaryClass,
  hintClass,
  inputClass,
  labelClass,
} from "../components/Modal";

export default function ResetPasswordDialog({ player, onClose, onDone }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/dm/players/${player.id}/password`, { password });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Reset password" onClose={onClose}>
      <form onSubmit={submit}>
        <p className={hintClass}>For {player.username}</p>
        <div className="mt-4">
          <label htmlFor="reset-password" className={labelClass}>
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
            required
          />
          <p className={hintClass}>8 to 72 characters.</p>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-red-400">
            {error}
          </p>
        )}
        <p className={hintClass}>
          Devices already signed in as {player.username} stay signed in until
          their session expires.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className={btnClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimaryClass} disabled={busy}>
            Set password
          </button>
        </div>
      </form>
    </Modal>
  );
}
