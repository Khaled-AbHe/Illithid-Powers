import { useState } from "react";
import { api } from "../api/client";
import Modal, {
  btnClass,
  btnPrimaryClass,
  hintClass,
  inputClass,
  labelClass,
} from "../components/Modal";

export default function AddPlayerDialog({ onClose, onDone }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onDone(
        await api.post("/dm/players", { username: username.trim(), password })
      );
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Add player" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mt-4">
          <label htmlFor="new-username" className={labelClass}>
            Username
          </label>
          <input
            id="new-username"
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            autoFocus
            required
          />
          <p className={hintClass}>
            Letters (accents are fine), numbers, spaces between words, and . - _
            &apos;
          </p>
        </div>
        <div className="mt-4">
          <label htmlFor="new-password" className={labelClass}>
            Password
          </label>
          <input
            id="new-password"
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <p className={hintClass}>8 to 72 characters.</p>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-red-400">
            {error}
          </p>
        )}
        {/* Cleanup (kept in case you change your mind): the note about what new players start with
        <p className={hintClass}>
          New players start with 0 vials and Illithid Identification.
        </p>
        */}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className={btnClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={btnPrimaryClass} disabled={busy}>
            Create player
          </button>
        </div>
      </form>
    </Modal>
  );
}
