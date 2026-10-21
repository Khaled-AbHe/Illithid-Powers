import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../api/client";
import { buildData } from "../assets/buildData";
import { images } from "../assets/images";

export const DataContext = createContext();

/**
 * Player data, loaded from the API (nothing is stored locally any more).
 * The server is the source of truth: it enforces prerequisites and vial costs.
 * status: "loading" | "ready" | "error"
 */
export function DataProvider({ children }) {
  const [catalog, setCatalog] = useState(null);
  const [claimed, setClaimed] = useState([]);
  const [vials, setVials] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const refreshing = useRef(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const [cat, me, mine] = await Promise.all([
        api.get("/abilities"),
        api.get("/me"),
        api.get("/me/abilities"),
      ]);
      setCatalog(cat);
      setVials(me.vials);
      setClaimed(mine);
      setStatus("ready");
    } catch (err) {
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-read the balance and claims, e.g. after the DM changed them. Failures
  // keep what's on screen rather than blanking the page.
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const [me, mine] = await Promise.all([
        api.get("/me"),
        api.get("/me/abilities"),
      ]);
      setVials(me.vials);
      setClaimed(mine);
    } catch {
      // ignore: the next focus or claim will try again
    } finally {
      refreshing.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  // Throws an ApiError when the server refuses (403 missing requirements / not
  // enough vials, 404). On those the local view was stale, so it is refreshed first.
  const claimPower = useCallback(
    async (key) => {
      try {
        const res = await api.post(`/me/abilities/${key}/claim`);
        setVials(res.vials);
        setClaimed((prev) => (prev.includes(key) ? prev : [...prev, key]));
        return res;
      } catch (err) {
        if (err.status === 403 || err.status === 404) await refresh();
        throw err;
      }
    },
    [refresh]
  );

  const data = useMemo(
    () => (catalog ? buildData(catalog, claimed, vials, images) : null),
    [catalog, claimed, vials]
  );

  return (
    <DataContext.Provider
      value={{ data, vials, status, error, reload: load, claimPower }}
    >
      {children}
    </DataContext.Provider>
  );
}
