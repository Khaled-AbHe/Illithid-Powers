import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

/**
 * Catalog + all players for the DM screen. Refreshing is manual: it happens on
 * load, after each of the DM's own actions, and when the window regains focus.
 * status: "loading" | "ready" | "error"
 */
export function useDmData() {
  const [catalog, setCatalog] = useState(null);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [cat, list] = await Promise.all([
        api.get("/abilities"),
        api.get("/dm/players"),
      ]);
      setCatalog(cat);
      setPlayers(list);
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only the newest response is applied, so a slow refresh can never overwrite
  // the fresher one that follows an action.
  const refresh = useCallback(async () => {
    const mine = ++latest.current;
    try {
      const list = await api.get("/dm/players");
      if (mine === latest.current) setPlayers(list);
    } catch {
      // keep what's on screen; the next action or focus will try again
    }
  }, []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  return { catalog, players, status, error, reload: load, refresh };
}
