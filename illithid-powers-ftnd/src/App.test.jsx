// Integration tests: the real React app against the real NestJS API (see src/test/globalSetup.js).
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getToken, setToken } from "./api/client";
import {
  apiUrl,
  call,
  dmToken as getDmToken,
  loginToken,
  renderApp,
  resetPlayer,
  setVials as dmSetVials,
} from "./test/apiHelpers";

let dmToken;
let aliceToken;
beforeAll(async () => {
  if (!apiUrl) return;
  dmToken = await getDmToken();
  aliceToken = await loginToken("Alice", "alice-pw");
});

const resetAlice = (vials) => resetPlayer("Alice", vials);

const power = (name) => screen.findByAltText(name);
const vialCount = () => screen.getByTestId("vial-count");

describe.skipIf(!apiUrl)("login and routing", () => {
  it("sends logged-out visitors to the login page", async () => {
    renderApp("/brain");
    expect(
      await screen.findByRole("heading", { name: "Illithid Powers" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("shows the server's message for a wrong password and stores nothing", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(screen.getByLabelText("Username"), "Alice");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password"
    );
    expect(getToken()).toBeNull();
  });

  it("logs a player in and lands on the brain", async () => {
    await resetAlice(4);
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(screen.getByLabelText("Username"), "Alice");
    await user.type(screen.getByLabelText("Password"), "alice-pw");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await power("Force Push")).toBeInTheDocument();
    expect(getToken()).toBeTruthy();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("logs the DM in and lands on the DM page", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(screen.getByLabelText("Username"), "DM");
    await user.type(screen.getByLabelText("Password"), "dm-pw");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByRole("heading", { name: "Players" })
    ).toBeInTheDocument();
  });

  it("keeps roles apart: a DM can't open /brain, a player can't open /dm", async () => {
    setToken(dmToken);
    const dm = renderApp("/brain");
    expect(
      await screen.findByRole("heading", { name: "Players" })
    ).toBeInTheDocument();
    dm.unmount();

    setToken(aliceToken);
    renderApp("/dm");
    expect(await power("Force Push")).toBeInTheDocument();
  });

  it("restores the session from a saved token", async () => {
    setToken(aliceToken);
    renderApp("/");
    expect(await power("Force Push")).toBeInTheDocument();
  });

  it("drops an invalid saved token and shows the login page", async () => {
    setToken("not-a-real-token");
    renderApp("/brain");
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("logs out", async () => {
    setToken(aliceToken);
    const user = userEvent.setup();
    renderApp("/brain");
    await power("Force Push");
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByLabelText("Username")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});

describe("when the server is unreachable", () => {
  it("offers to retry instead of logging the user out", async () => {
    setToken("some-token");
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("fetch failed")));
    renderApp("/brain");
    expect(
      await screen.findByText(/can't reach the server/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" })
    ).toBeInTheDocument();
    expect(getToken()).toBe("some-token");
  });
});

describe.skipIf(!apiUrl)("player view", () => {
  async function openBrain() {
    setToken(aliceToken);
    renderApp("/brain");
    await power("Force Push");
  }

  it("shows all 21 powers and the balance set by the DM", async () => {
    await resetAlice(6);
    await openBrain();
    const powers = screen
      .getAllByRole("img")
      .filter((img) => img.getAttribute("alt"));
    expect(powers).toHaveLength(21);
    expect(vialCount()).toHaveTextContent("6");
  });

  it("has no way to change vials: no arrows and no Reset", async () => {
    await resetAlice(6);
    await openBrain();
    expect(screen.queryByText("⋀")).not.toBeInTheDocument();
    expect(screen.queryByText("⋁")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset" })
    ).not.toBeInTheDocument();
  });

  it("marks only the root as claimed at first", async () => {
    await resetAlice(6);
    await openBrain();
    expect((await power("Illithid Identification")).parentElement).toHaveClass(
      "border-pink-500"
    );
    expect((await power("Force Push")).parentElement).toHaveClass(
      "border-slate-600"
    );
  });

  it("claims a power: asks in the page first, charges the server, and persists across a reload", async () => {
    await resetAlice(3);
    const user = userEvent.setup();
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    await openBrain();

    await user.click(await power("Force Push"));
    await user.click(await screen.findByRole("button", { name: "Claim" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Claim Force Push?",
    });
    expect(dialog).toHaveTextContent("Costs 1 vial. Balance 3 → 2.");
    // rendered at the top of the page, not inside the brain's scaled container
    expect(dialog.parentElement.parentElement).toBe(document.body);
    expect(dialog).toHaveTextContent(/won't be able to unclaim it/);
    const confirm = within(dialog).getByRole("button", { name: "Claim" });
    expect(confirm).toBeDisabled(); // nothing happens until YES is typed
    await user.type(
      within(dialog).getByLabelText("Type YES to confirm"),
      "yes"
    );
    await user.click(confirm);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(vialCount()).toHaveTextContent("2"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Claimed" })).toBeDisabled()
    );
    expect(prompt).not.toHaveBeenCalled(); // no browser pop-ups
    expect(alert).not.toHaveBeenCalled();

    // The server really has it...
    const mine = await call("/me/abilities", { token: aliceToken });
    expect(mine.body).toContain("ForcePush");
    expect((await call("/me", { token: aliceToken })).body.vials).toBe(2);

    // ...so a fresh page load shows it too (nothing is kept locally).
    document.body.innerHTML = "";
    localStorage.removeItem("psionicData");
    renderApp("/brain");
    expect((await power("Force Push")).parentElement).toHaveClass(
      "border-pink-500"
    );
    expect(vialCount()).toHaveTextContent("2");
  });

  it("does nothing when the confirmation is cancelled, closed, or not 'yes'", async () => {
    await resetAlice(3);
    const user = userEvent.setup();
    await openBrain();
    await user.click(await power("Force Push"));
    const open = async () => {
      await user.click(await screen.findByRole("button", { name: "Claim" }));
      return screen.findByRole("dialog", { name: "Claim Force Push?" });
    };

    let dialog = await open();
    await user.type(within(dialog).getByLabelText("Type YES to confirm"), "no");
    expect(
      within(dialog).getByRole("button", { name: "Claim" })
    ).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    dialog = await open();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(vialCount()).toHaveTextContent("3");
    expect((await call("/me/abilities", { token: aliceToken })).body).toEqual([
      "IllithidIdentification",
    ]);
  });

  it("shows 'Missing Requirements!' when no prerequisite is claimed", async () => {
    await resetAlice(6);
    const user = userEvent.setup();
    await openBrain();
    await user.click(await power("Black Hole"));
    const btn = await screen.findByRole("button", {
      name: "Missing Requirements!",
    });
    expect(btn).toBeDisabled();
  });

  it("shows 'Not Enough Vials!' when the balance is too low", async () => {
    await resetAlice(0);
    const user = userEvent.setup();
    await openBrain();
    await user.click(await power("Force Push"));
    expect(
      await screen.findByRole("button", { name: "Not Enough Vials!" })
    ).toBeDisabled();
  });

  it("when the page is stale, the server refuses, the dialog says why, and the view corrects itself", async () => {
    const id = await resetAlice(3);
    const user = userEvent.setup();
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    await openBrain();
    await user.click(await power("Force Push"));
    await user.click(await screen.findByRole("button", { name: "Claim" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Claim Force Push?",
    });
    await user.type(
      within(dialog).getByLabelText("Type YES to confirm"),
      "yes"
    );

    await dmSetVials(id, 0); // DM takes the vials away behind the page's back
    await user.click(within(dialog).getByRole("button", { name: "Claim" }));

    // the reason appears inside the dialog, not in a pop-up...
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /not enough vials/i
    );
    expect(prompt).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    // ...retrying can't help, so only Close is offered...
    expect(
      within(dialog).queryByRole("button", { name: "Claim" })
    ).not.toBeInTheDocument();
    // ...and the page behind it has already corrected itself
    await waitFor(() => expect(vialCount()).toHaveTextContent("0"));
    expect((await call("/me/abilities", { token: aliceToken })).body).toEqual([
      "IllithidIdentification",
    ]);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a connection failure in the dialog and lets them try again", async () => {
    await resetAlice(3);
    const user = userEvent.setup();
    const alert = vi.spyOn(window, "alert");
    await openBrain();
    await user.click(await power("Force Push"));
    await user.click(await screen.findByRole("button", { name: "Claim" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Type YES to confirm"),
      "yes"
    );

    const realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", (url, init) =>
      init?.method === "POST"
        ? Promise.reject(new TypeError("fetch failed"))
        : realFetch(url, init)
    );
    await user.click(within(dialog).getByRole("button", { name: "Claim" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      /can't reach the server/i
    );
    expect(alert).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("button", { name: "Claim" })).toBeEnabled(); // not refused, so retry is offered

    vi.unstubAllGlobals(); // the connection is back
    await user.click(within(dialog).getByRole("button", { name: "Claim" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect((await call("/me/abilities", { token: aliceToken })).body).toContain(
      "ForcePush"
    );
  });

  it("picks up the DM's changes when the window regains focus", async () => {
    const id = await resetAlice(3);
    await openBrain();
    expect(vialCount()).toHaveTextContent("3");

    await dmSetVials(id, 5);
    window.dispatchEvent(new Event("focus"));
    await waitFor(() => expect(vialCount()).toHaveTextContent("5"));
  });

  it("shows the server's own cost and prerequisite text in the description", async () => {
    await resetAlice(6);
    const user = userEvent.setup();
    await openBrain();
    await user.click(await power("Psionic Backlash"));
    const dialog = (await screen.findByText(/Requirements:/)).closest("div");
    expect(
      within(dialog).getByText(/Force Push or Kyara's Influence/)
    ).toBeInTheDocument();
  });
});
