// Shared by the integration tests: talk to the real API directly, and render the real app.
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { inject } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth/AuthProvider";

export const apiUrl = inject("apiUrl");

export async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(apiUrl + path, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

export const loginToken = async (username, password) =>
  (await call("/auth/login", { method: "POST", body: { username, password } }))
    .body.accessToken;

let dmTokenPromise;
/** A DM token, fetched once. */
export const dmToken = () => (dmTokenPromise ??= loginToken("DM", "dm-pw"));
export const dmCall = async (path, opts = {}) =>
  call(path, { ...opts, token: await dmToken() });

/** The DM puts a seeded player back to a clean slate with the given balance. */
export async function resetPlayer(username, vials) {
  const players = (await dmCall("/dm/players")).body;
  const player = players.find((p) => p.username === username);
  await dmCall(`/dm/players/${player.id}/reset`, { method: "POST" });
  await dmCall(`/dm/players/${player.id}/vials`, {
    method: "PATCH",
    body: { available: vials },
  });
  return player.id;
}
export const setVials = (id, available) =>
  dmCall(`/dm/players/${id}/vials`, { method: "PATCH", body: { available } });

export function renderApp(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}
