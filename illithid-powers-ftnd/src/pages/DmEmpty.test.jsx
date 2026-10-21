// The DM pages when there are no players at all. The seeded players can't all be
// deleted, so the server is stubbed for this one: real catalog, no players.
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { setToken } from "../api/client";
import { apiUrl, call, dmToken, renderApp } from "../test/apiHelpers";
import { tab } from "../test/dmHelpers";

describe.skipIf(!apiUrl)("DM pages with no players", () => {
  it("shows an empty state on both pages, with no player controls", async () => {
    const user = userEvent.setup();
    const token = await dmToken();
    const catalog = (await call("/abilities", { token })).body;
    const realFetch = globalThis.fetch;
    const json = (body) => new Response(JSON.stringify(body), { status: 200 });
    vi.stubGlobal("fetch", async (url, init) => {
      const path = new URL(url).pathname;
      if (path === "/me")
        return json({ id: 1, username: "DM", role: "dm", vials: 0 });
      if (path === "/abilities") return json(catalog);
      if (path === "/dm/players") return json([]);
      return realFetch(url, init);
    });

    setToken(token);
    renderApp("/dm/players");
    expect(
      await screen.findByText("No players yet. Add one to get started.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add player" })).toBeEnabled();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete…" })
    ).not.toBeInTheDocument();

    await user.click(tab("Powers"));
    expect(
      await screen.findByText("No players yet. Add one on the Players page.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Set vials" })
    ).not.toBeInTheDocument();
  });
});
