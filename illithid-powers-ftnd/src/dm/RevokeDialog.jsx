import { useEffect, useState } from "react";
import { api } from "../api/client";
import Modal, {
  btnClass,
  btnDangerFillClass,
  hintClass,
  inputClass,
  labelClass,
} from "../components/Modal";
import { orList, plural } from "./util";

/** Shows exactly what the server says a revoke will do, then asks for YES. */
export default function RevokeDialog({
  player,
  power,
  byKey,
  onClose,
  onDone,
}) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/dm/players/${player.id}/abilities/${power.key}/revoke-preview`)
      .then((p) => !cancelled && setPreview(p))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [player.id, power.key]);

  const confirmed = confirm.trim().toLowerCase() === "yes";

  async function revoke() {
    setBusy(true);
    setError("");
    try {
      const result = await api.delete(
        `/dm/players/${player.id}/abilities/${power.key}`
      );
      onDone(result);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const reason = (item) => {
    const needs = (byKey[item.key]?.requires ?? []).map(
      (k) => byKey[k]?.name ?? k
    );
    return `Needs ${orList(needs)}, and none of it will be left`;
  };

  return (
    <Modal title={`Revoke ${power.name}?`} danger onClose={onClose}>
      <p className={hintClass}>{player.username}</p>

      {!preview && !error && (
        <p className="mt-4">Checking what this would remove&hellip;</p>
      )}

      {preview && !preview.owned && (
        <p className="mt-4">
          {player.username} no longer has this power. Nothing to revoke.
        </p>
      )}

      {preview?.owned && (
        <>
          <ul>
            {preview.removed.map((item, i) => (
              <li
                key={item.key}
                className="flex items-start justify-between gap-4 border-t border-stone-800 py-2.5"
              >
                <span>
                  <strong>{item.name}</strong>
                  {i > 0 && (
                    <>
                      <br />
                      <span className="text-sm text-stone-400">
                        {reason(item, i)}
                      </span>
                    </>
                  )}
                </span>
                <strong className="whitespace-nowrap text-purple-300">
                  +{item.vialCost}
                </strong>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t-2 border-stone-700 pt-3 text-lg">
            <strong>Refund</strong>
            <strong className="text-purple-300">
              {plural(preview.refund, "vial")} &middot; balance {preview.vials}{" "}
              &rarr; {preview.vialsAfter}
            </strong>
          </p>
          {preview.kept.map((k) => (
            <p key={k.key} className="mt-3 text-sm text-stone-300">
              <strong>Stays:</strong> {k.name}, because{" "}
              {orList(k.via.map((v) => v.name))} is still claimed.
            </p>
          ))}
          <div className="mt-5">
            <label htmlFor="confirm-revoke" className={labelClass}>
              Type YES to confirm
            </label>
            <input
              id="confirm-revoke"
              className={inputClass + " border-red-500"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-red-400">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <button className={btnClass} onClick={onClose}>
          Cancel
        </button>
        {preview?.owned && (
          <button
            className={btnDangerFillClass}
            disabled={!confirmed || busy}
            onClick={revoke}
          >
            Revoke {plural(preview.removed.length, "power")}
          </button>
        )}
      </div>
    </Modal>
  );
}
