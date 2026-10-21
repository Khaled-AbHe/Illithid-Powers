// Helpers shared by the DM page tests (real app, real API).
import { screen } from "@testing-library/react";
import { expect } from "vitest";
import { setToken } from "../api/client";
import { call, dmCall, dmToken, loginToken, renderApp } from "./apiHelpers";

export const ROOT = "IllithidIdentification";

let alice;
const aliceToken = async () =>
  (alice ??= await loginToken("Alice", "alice-pw"));

/** Alice claims powers through her own API, like a player would. */
export async function aliceClaims(...keys) {
  const token = await aliceToken();
  for (const key of keys) {
    const res = await call(`/me/abilities/${key}/claim`, {
      method: "POST",
      token,
    });
    expect(res.status).toBe(200);
  }
}

export const serverAlice = async () =>
  (await dmCall("/dm/players")).body.find((p) => p.username === "Alice");

async function open(path, ready) {
  setToken(await dmToken());
  renderApp(path);
  await ready();
}
/** Powers page, ready once the first player (Alice) is selected. */
export const openPowers = (path = "/dm/powers") =>
  open(path, () => screen.findByRole("heading", { name: "Alice" }));
/** Players page, ready once its heading is up. */
export const openPlayers = (path = "/dm/players") =>
  open(path, () => screen.findByRole("heading", { name: "Players", level: 1 }));

export const node = (name) => screen.getByRole("button", { name });
export const card = (name) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });
export const panel = () =>
  screen.getByRole("complementary", { name: "Selected player" });
export const row = (name) => screen.getByRole("listitem", { name });
export const tab = (name) => screen.getByRole("link", { name });

/** A disposable player for tests that rename or delete (never touch the seeded ones). */
export async function createPlayer(name, password = "test-password-1") {
  const res = await dmCall("/dm/players", {
    method: "POST",
    body: { username: name, password },
  });
  expect(res.status).toBe(201);
  return { ...res.body, password };
}
