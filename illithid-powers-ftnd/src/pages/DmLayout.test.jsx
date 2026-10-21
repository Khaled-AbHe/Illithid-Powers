// Integration tests for the DM frame: tabs, routing and the data both pages share.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { getToken, setToken } from "../api/client";
import { apiUrl, loginToken, renderApp, resetPlayer } from "../test/apiHelpers";
import { card, openPlayers, openPowers, tab } from "../test/dmHelpers";

describe.skipIf(!apiUrl)("DM layout", () => {
  beforeEach(async () => {
    await resetPlayer("Alice", 4);
    await resetPlayer("Bob", 2);
  });

  it("sends /dm to the Powers page", async () => {
    await openPowers("/dm");
    expect(tab("Powers")).toHaveAttribute("aria-current", "page");
    expect(tab("Players")).not.toHaveAttribute("aria-current");
  });

  it("opens either page directly", async () => {
    await openPlayers("/dm/players");
    expect(tab("Players")).toHaveAttribute("aria-current", "page");
  });

  it("sends an unknown DM path back to the Powers page", async () => {
    await openPowers("/dm/nonsense");
    expect(tab("Powers")).toHaveAttribute("aria-current", "page");
  });

  it("switches pages with the tabs", async () => {
    const user = userEvent.setup();
    await openPowers();
    await user.click(tab("Players"));
    expect(
      await screen.findByRole("heading", { name: "Players", level: 1 })
    ).toBeInTheDocument();
    expect(tab("Players")).toHaveAttribute("aria-current", "page");
    expect(tab("Powers")).not.toHaveAttribute("aria-current");
    await user.click(tab("Powers"));
    expect(
      await screen.findByRole("heading", { name: "Alice" })
    ).toBeInTheDocument();
    expect(tab("Powers")).toHaveAttribute("aria-current", "page");
  });

  it("keeps the selected player when you switch pages and come back", async () => {
    const user = userEvent.setup();
    await openPowers();
    await user.click(card("Bob"));
    expect(
      await screen.findByRole("heading", { name: "Bob" })
    ).toBeInTheDocument();
    await user.click(tab("Players"));
    await screen.findByRole("heading", { name: "Players", level: 1 });
    await user.click(tab("Powers"));
    expect(
      await screen.findByRole("heading", { name: "Bob" })
    ).toBeInTheDocument();
  });

  it("shows the DM's name and logs out from either page", async () => {
    const user = userEvent.setup();
    await openPlayers();
    expect(screen.getByText("DM")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("is for the DM only", async () => {
    setToken(await loginToken("Alice", "alice-pw"));
    renderApp("/dm/players");
    expect(await screen.findByAltText("Force Push")).toBeInTheDocument(); // her own brain
    expect(
      screen.queryByRole("navigation", { name: "DM pages" })
    ).not.toBeInTheDocument();
  });

  it("sends logged-out visitors to the login page", async () => {
    renderApp("/dm/players");
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
  });

  it("loads once: a change on the Powers page shows on the Players page without another login", async () => {
    const user = userEvent.setup();
    await openPowers();
    const input = screen.getByLabelText("Available vials");
    await user.clear(input);
    await user.type(input, "9");
    await user.click(screen.getByRole("button", { name: "Set vials" }));
    await waitFor(() => expect(card("Alice")).toHaveTextContent("9 vials"));
    await user.click(tab("Players"));
    await waitFor(() =>
      expect(screen.getByRole("listitem", { name: "Alice" })).toHaveTextContent(
        "9 vials"
      )
    );
  });
});
