import { useState } from "react";
import AddPlayerDialog from "../dm/AddPlayerDialog";
import DeleteDialog from "../dm/DeleteDialog";
import { useDm } from "../dm/dmContext";
import { btnClass, btnDangerClass, btnPrimaryClass } from "../components/Modal";
import RenameDialog from "../dm/RenameDialog";
import ResetPasswordDialog from "../dm/ResetPasswordDialog";
import { plural } from "../dm/util";

/** Account management. Powers and vials live on the Powers page. */
export default function DmPlayers() {
  const { catalog, players, setSelectedId, refresh } = useDm();
  const [dialog, setDialog] = useState(null); // { type: "add" } | { type: "rename" | "password" | "delete", player }
  const [notice, setNotice] = useState("");

  const done = async (message) => {
    setDialog(null);
    setNotice(message);
    await refresh();
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-pink-300">Players</h1>
          </div>
          <button
            className={btnPrimaryClass}
            onClick={() => setDialog({ type: "add" })}
          >
            Add player
          </button>
        </div>

        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl bg-pink-500/10 px-3 py-2 text-sm text-pink-200"
          >
            {notice}
          </p>
        )}

        {players.length === 0 ? (
          <p className="text-stone-400">
            No players yet. Add one to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {players.map((p) => (
              <li
                key={p.id}
                aria-label={p.username}
                className="flex items-center justify-between gap-4 rounded-2xl border-2 border-stone-800 bg-stone-900 px-5 py-3.5"
              >
                <div>
                  <strong className="text-xl">{p.username}</strong>
                  <p className="text-sm text-stone-400">
                    {p.claimed.length} / {catalog.length} powers &middot;{" "}
                    {plural(p.vials, "vial")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className={btnClass}
                    onClick={() => setDialog({ type: "rename", player: p })}
                  >
                    Rename
                  </button>
                  <button
                    className={btnClass}
                    onClick={() => setDialog({ type: "password", player: p })}
                  >
                    Reset password
                  </button>
                  <button
                    className={btnDangerClass}
                    onClick={() => setDialog({ type: "delete", player: p })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog?.type === "add" && (
        <AddPlayerDialog
          onClose={() => setDialog(null)}
          onDone={(created) => {
            setSelectedId(created.id); // so the Powers page opens on them
            done("");
          }}
        />
      )}
      {dialog?.type === "rename" && (
        <RenameDialog player={dialog.player} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "delete" && (
        <DeleteDialog
          player={dialog.player}
          onClose={() => setDialog(null)}
          onDone={({ alreadyGone }) =>
            done(
              alreadyGone
                ? `${dialog.player.username} was already deleted.`
                : `Deleted ${dialog.player.username}.`
            )
          }
        />
      )}
      {dialog?.type === "password" && (
        <ResetPasswordDialog
          player={dialog.player}
          onClose={() => setDialog(null)}
          onDone={() => done(`Password reset for ${dialog.player.username}.`)}
        />
      )}
    </main>
  );
}
