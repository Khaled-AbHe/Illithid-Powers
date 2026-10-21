import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import FullScreenMessage from "../components/FullScreenMessage";
import { DmContext } from "./dmContext";
import { btnClass } from "../components/Modal";
import { useDmData } from "./useDmData";

const tabClass = ({ isActive }) =>
  "border-b-[3px] px-1 py-4 font-bold " +
  (isActive
    ? "border-pink-500 text-pink-300"
    : "border-transparent text-stone-400 hover:text-stone-200");

/**
 * Frame for both DM pages: header with the Powers / Players tabs, and the data
 * they share. Loading it once here means switching tabs is instant and the
 * selected player carries over.
 */
export default function DmLayout() {
  const { user, logout } = useAuth();
  const { catalog, players, status, error, reload, refresh } = useDmData();
  const [selectedId, setSelectedId] = useState(null);

  const byKey = useMemo(
    () => Object.fromEntries((catalog ?? []).map((a) => [a.key, a])),
    [catalog]
  );

  if (status === "loading") {
    return <FullScreenMessage>Loading…</FullScreenMessage>;
  }
  if (status === "error") {
    return (
      <FullScreenMessage>
        <p>{error.message}</p>
        <button className={btnClass} onClick={reload}>
          Try again
        </button>
      </FullScreenMessage>
    );
  }

  const player = players.find((p) => p.id === selectedId) ?? players[0] ?? null;
  const value = {
    catalog,
    byKey,
    players,
    player,
    setSelectedId,
    refresh,
  };

  return (
    <DmContext.Provider value={value}>
      <div className="flex h-screen w-full flex-col bg-stone-950 text-stone-200 select-none">
        <header className="flex h-14 shrink-0 items-stretch justify-between border-b-2 border-stone-800 px-6">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold text-pink-500">
              Illithid Powers{" "}
              <span className="text-lg font-normal text-stone-400">/ DM</span>
            </span>
            <nav aria-label="DM pages" className="flex items-stretch gap-6 ml-6">
              <NavLink to="/dm/powers" className={tabClass}>
                Powers
              </NavLink>
              <NavLink to="/dm/players" className={tabClass}>
                Players
              </NavLink>
            </nav>
          </div>
          <span className="flex items-center gap-3">
            <strong>{user.username}</strong>
            <button className={btnClass} onClick={logout}>
              Log out
            </button>
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </DmContext.Provider>
  );
}
