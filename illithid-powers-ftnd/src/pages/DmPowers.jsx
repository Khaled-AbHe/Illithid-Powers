import { useState } from "react";
import { api } from "../api/client";
import { images } from "../assets/images";
import BrainStage from "../dm/BrainStage";
import DmPower from "../dm/DmPower";
import { btnDangerClass } from "../components/Modal";
import PlayerList from "../dm/PlayerList";
import PowerPanel from "../dm/PowerPanel";
import RevokeDialog from "../dm/RevokeDialog";
import { plural } from "../dm/util";
import { useDm } from "../dm/dmContext";
import VialsEditor from "../dm/VialsEditor";

export default function DmPowers() {
  const { catalog, byKey, players, player, setSelectedId, refresh } = useDm();
  const [powerKey, setPowerKey] = useState(null);
  const [dialog, setDialog] = useState(null); // "revoke"
  const [notice, setNotice] = useState("");
  const [resetError, setResetError] = useState("");

  const power = powerKey ? byKey[powerKey] : null;

  const done = async (message) => {
    setDialog(null);
    setNotice(message);
    await refresh();
  };

  async function saveVials(available) {
    await api.patch(`/dm/players/${player.id}/vials`, { available });
    await refresh();
  }

  async function grant(key) {
    try {
      await api.put(`/dm/players/${player.id}/abilities/${key}`);
      setNotice("");
    } catch (err) {
      // The screen was probably stale (e.g. the player spent vials meanwhile).
      await refresh();
      throw err;
    }
    await refresh();
  }

  async function resetPlayer() {
    setResetError("");
    try {
      const res = await api.post(`/dm/players/${player.id}/reset`);
      setNotice(
        `Reset ${player.username}: ${plural(res.removed.length, "power")} removed, vials set to 0.`
      );
      await refresh();
    } catch (err) {
      setResetError(err.message);
    }
  }

  const renderPower = (key) => (
    <DmPower
      power={{ name: byKey[key].name, imgPath: images[key] }}
      claimed={!!player?.claimed.includes(key)}
      selected={powerKey === key}
      onSelect={() => setPowerKey(key)}
    />
  );

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <PlayerList
          players={players}
          selectedId={player?.id}
          total={catalog.length}
          onSelect={(id) => {
            setSelectedId(id);
            setNotice("");
            setResetError("");
          }}
        />

        {player ? (
          <>
            <BrainStage renderPower={renderPower} />
            <aside
              aria-label="Selected player"
              className="flex w-90 shrink-0 flex-col gap-3.5 overflow-y-auto border-l-2 border-stone-800 p-5"
            >
              <div>
                <h2 className="text-3xl font-bold text-pink-300">
                  {player.username}
                </h2>
              </div>
              {notice && (
                <p
                  role="status"
                  className="rounded-xl bg-pink-500/10 px-3 py-2 text-sm text-pink-200"
                >
                  {notice}
                </p>
              )}
              <VialsEditor
                key={`${player.id}:${player.vials}`}
                vials={player.vials}
                onSave={saveVials}
              />
              <PowerPanel
                player={player}
                power={power}
                byKey={byKey}
                onGrant={grant}
                onRevoke={() => setDialog("revoke")}
              />
              <button className={btnDangerClass} onClick={resetPlayer}>
                Reset player
              </button>
              {resetError && (
                <p role="alert" className="text-sm text-red-400">
                  {resetError}
                </p>
              )}
            </aside>
          </>
        ) : (
          <p className="flex-1 p-8 text-stone-400">
            No players yet. Add one on the Players page.
          </p>
        )}
      </div>

      {dialog === "revoke" && player && power && (
        <RevokeDialog
          player={player}
          power={power}
          byKey={byKey}
          onClose={() => setDialog(null)}
          onDone={(res) =>
            done(
              `Removed ${plural(res.removed.length, "power")} from ${player.username}, refunded ${plural(res.refunded, "vial")}.`
            )
          }
        />
      )}
    </>
  );
}
