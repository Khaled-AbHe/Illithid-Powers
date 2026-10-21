import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "../api/client";
import { AuthContext } from "./authContext";

/**
 * Holds the logged-in user. Only the JWT is kept in localStorage; on load it is
 * checked against GET /me, which also tells us the user's role.
 * status: "loading" | "anonymous" | "authenticated" | "error" (server unreachable)
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? "loading" : "anonymous");

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const restore = useCallback(() => {
    if (!getToken()) return () => {};
    let cancelled = false;
    setStatus("loading");
    api
      .get("/me")
      .then((me) => {
        if (cancelled) return;
        setUser({ id: me.id, username: me.username, role: me.role });
        setStatus("authenticated");
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 already logged us out via the handler; anything else is a connectivity problem.
        if (err.status !== 401) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => restore(), [restore]);

  const login = useCallback(async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    setToken(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
    return res.user;
  }, []);

  // DMs: the credential is what Google gave the browser; the server verifies it.
  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.post("/auth/google", { credential });
    setToken(res.accessToken);
    setUser(res.user);
    setStatus("authenticated");
    return res.user;
  }, []);

  const value = useMemo(
    () => ({ user, status, login, loginWithGoogle, logout, retry: restore }),
    [user, status, login, loginWithGoogle, logout, restore]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
