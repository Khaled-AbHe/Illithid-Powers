// Integration tests for the DM Players page: the real React app against the real NestJS API.
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  apiUrl,
  call,
  dmCall,
  loginToken,
  renderApp,
  resetPlayer,
} from "../test/apiHelpers";
import {
  card,
  createPlayer,
  openPlayers,
  ROOT,
  row,
  tab,
} from "../test/dmHelpers";

describe.skipIf(!apiUrl)("DM Players page", () => {
  let aliceId;
  beforeEach(async () => {
    aliceId = await resetPlayer("Alice", 4);
    await resetPlayer("Bob", 2);
  });

  it("lists every player with their claim count and balance, and never the DM", async () => {
    await openPlayers();
    expect(row("Alice")).toHaveTextContent("1 / 21 powers");
    expect(row("Alice")).toHaveTextContent("4 vials");
    expect(row("Bob")).toHaveTextContent("2 vials");
    expect(
      screen.queryByRole("listitem", { name: "DM" })
    ).not.toBeInTheDocument();
  });

  it("has no power or vial controls: those live on the Powers page", async () => {
    await openPlayers();
    expect(
      screen.queryByRole("button", { name: "Set vials" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Force Push" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset player" })
    ).not.toBeInTheDocument();
  });

  describe("add player", () => {
    it("adds a player, lists them, and they can log in", async () => {
      const user = userEvent.setup();
      const name = `Zed${Date.now()}`;
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog", { name: "Add player" });
      await user.type(within(dialog).getByLabelText("Username"), name);
      await user.type(
        within(dialog).getByLabelText("Password"),
        "zed-password-1"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );

      await waitFor(() => expect(row(name)).toBeInTheDocument());
      expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no "Created" message any more
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      await waitFor(() => expect(row(name)).toHaveTextContent("1 / 21 powers"));
      expect(row(name)).toHaveTextContent("0 vials");
      expect(await loginToken(name, "zed-password-1")).toBeTruthy();
    });

    it("opens the Powers page on the player you just created", async () => {
      const user = userEvent.setup();
      const name = `Yan${Date.now()}`;
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText("Username"), name);
      await user.type(
        within(dialog).getByLabelText("Password"),
        "yan-password-1"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );

      await user.click(tab("Powers"));
      expect(await screen.findByRole("heading", { name })).toBeInTheDocument();
    });

    it("shows the server's reason when the name is taken or the password is too short", async () => {
      const user = userEvent.setup();
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText("Username"), "alice"); // differs only by case
      await user.type(
        within(dialog).getByLabelText("Password"),
        "long-enough-pw"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );
      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        /taken/i
      );

      await user.clear(within(dialog).getByLabelText("Username"));
      await user.type(within(dialog).getByLabelText("Username"), "fresh-name");
      await user.clear(within(dialog).getByLabelText("Password"));
      await user.type(within(dialog).getByLabelText("Password"), "short");
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );
      await waitFor(() =>
        expect(within(dialog).getByRole("alert")).toHaveTextContent(/password/i)
      );
    });

    it("cancelling creates nothing", async () => {
      const user = userEvent.setup();
      await openPlayers();
      const before = (await dmCall("/dm/players")).body.length;
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Username"),
        "ghost-player"
      );
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect((await dmCall("/dm/players")).body).toHaveLength(before);
    });
  });

  describe("reset password", () => {
    it("resets that player's password: the old one stops working, the new one works", async () => {
      const user = userEvent.setup();
      await openPlayers();
      await user.click(
        within(row("Alice")).getByRole("button", { name: "Reset password" })
      );
      const dialog = await screen.findByRole("dialog", {
        name: "Reset password",
      });
      expect(within(dialog).getByText(/For Alice/)).toBeInTheDocument();
      await user.type(
        within(dialog).getByLabelText("New password"),
        "brand-new-pw"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Set password" })
      );
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Password reset for Alice."
      );
      try {
        expect(
          (
            await call("/auth/login", {
              method: "POST",
              body: { username: "Alice", password: "alice-pw" },
            })
          ).status
        ).toBe(401);
        expect(await loginToken("Alice", "brand-new-pw")).toBeTruthy();
      } finally {
        // other tests log in as Alice
        await dmCall(`/dm/players/${aliceId}/password`, {
          method: "PATCH",
          body: { password: "alice-pw" },
        });
      }
    });

    it("targets the row you clicked, not another player", async () => {
      const user = userEvent.setup();
      await openPlayers();
      await user.click(
        within(row("Bob")).getByRole("button", { name: "Reset password" })
      );
      expect(
        await screen.findByRole("dialog", { name: "Reset password" })
      ).toHaveTextContent("For Bob");
    });

    it("rejects a too-short password and changes nothing", async () => {
      const user = userEvent.setup();
      await openPlayers();
      await user.click(
        within(row("Alice")).getByRole("button", { name: "Reset password" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText("New password"), "short");
      await user.click(
        within(dialog).getByRole("button", { name: "Set password" })
      );
      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        /password/i
      );
      expect(await loginToken("Alice", "alice-pw")).toBeTruthy();
    });
  });

  it("keeps the root power in the count: a new player shows 1 / 21", async () => {
    await openPlayers();
    const alice = (await dmCall("/dm/players")).body.find(
      (p) => p.username === "Alice"
    );
    expect(alice.claimed).toEqual([ROOT]);
    expect(row("Alice")).toHaveTextContent("1 / 21 powers");
  });

  describe("rename", () => {
    it("renames a player: the list, the Powers page and the login all use the new name", async () => {
      const user = userEvent.setup();
      const name = `Ren${Date.now()}`;
      const created = await createPlayer(name);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog", {
        name: `Rename ${name}`,
      });
      const input = within(dialog).getByLabelText("New name");
      expect(input).toHaveValue(name);
      expect(
        within(dialog).getByRole("button", { name: "Save name" })
      ).toBeDisabled(); // unchanged
      await user.clear(input);
      await user.type(input, `${name}x`);
      await user.click(
        within(dialog).getByRole("button", { name: "Save name" })
      );

      await waitFor(() => expect(row(`${name}x`)).toBeInTheDocument());
      await waitFor(() => expect(row(`${name}x`)).toBeInTheDocument());
      expect(screen.queryByRole("listitem", { name })).not.toBeInTheDocument();
      expect(await loginToken(`${name}x`, created.password)).toBeTruthy();
      expect(
        (
          await call("/auth/login", {
            method: "POST",
            body: { username: name, password: created.password },
          })
        ).status
      ).toBe(401);

      await user.click(tab("Powers"));
      expect(
        await screen.findByRole("button", { name: new RegExp(`^${name}x`) })
      ).toBeInTheDocument();
    });

    it("keeps the player's open session working", async () => {
      const user = userEvent.setup();
      const name = `Ses${Date.now()}`;
      const created = await createPlayer(name);
      const token = await loginToken(name, created.password);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.clear(within(dialog).getByLabelText("New name"));
      await user.type(within(dialog).getByLabelText("New name"), `${name}x`);
      await user.click(
        within(dialog).getByRole("button", { name: "Save name" })
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      const me = await call("/me", { token });
      expect(me.status).toBe(200);
      expect(me.body.username).toBe(`${name}x`);
    });

    it("allows changing only the capitals", async () => {
      const user = userEvent.setup();
      const name = `cap${Date.now()}`;
      const created = await createPlayer(name);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.clear(within(dialog).getByLabelText("New name"));
      await user.type(
        within(dialog).getByLabelText("New name"),
        name.toUpperCase()
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Save name" })
      );
      await waitFor(() => expect(row(name.toUpperCase())).toBeInTheDocument());
      expect(
        await loginToken(name.toUpperCase(), created.password)
      ).toBeTruthy();
    });

    it("shows the server's reason when the name is taken or invalid", async () => {
      const user = userEvent.setup();
      const name = `Bad${Date.now()}`;
      await createPlayer(name);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog");
      const input = within(dialog).getByLabelText("New name");
      await user.clear(input);
      await user.type(input, "alice"); // taken by Alice, ignoring capitals
      await user.click(
        within(dialog).getByRole("button", { name: "Save name" })
      );
      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        /taken/i
      );

      await user.clear(input);
      await user.type(input, "semi;colon");
      await user.click(
        within(dialog).getByRole("button", { name: "Save name" })
      );
      await waitFor(() =>
        expect(within(dialog).getByRole("alert")).toHaveTextContent(
          /1-64 characters/
        )
      );
      expect(row(name)).toBeInTheDocument(); // nothing changed
    });

    it("cancelling renames nothing", async () => {
      const user = userEvent.setup();
      const name = `Can${Date.now()}`;
      await createPlayer(name);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText("New name"), "zzz");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(row(name)).toBeInTheDocument();
    });
  });

  describe("delete", () => {
    it("asks for YES, then deletes the player and locks them out", async () => {
      const user = userEvent.setup();
      const name = `Del${Date.now()}`;
      const created = await createPlayer(name);
      await dmCall(`/dm/players/${created.id}/vials`, {
        method: "PATCH",
        body: { available: 3 },
      });
      const token = await loginToken(name, created.password);
      await call("/me/abilities/ForcePush/claim", { method: "POST", token }); // 3 -> 2
      await openPlayers();

      await user.click(
        within(row(name)).getByRole("button", { name: "Delete…" })
      );
      const dialog = await screen.findByRole("dialog", {
        name: `Delete ${name}?`,
      });
      expect(dialog).toHaveTextContent(/1 power and 2 vials/);
      expect(dialog).toHaveTextContent(/can't be undone/);
      expect(dialog).not.toHaveTextContent(/signed out right away/); // cleaned-up text
      const confirm = within(dialog).getByRole("button", {
        name: "Delete player",
      });
      expect(confirm).toBeDisabled();
      const field = within(dialog).getByLabelText("Type YES to confirm");
      await user.type(field, "no");
      expect(confirm).toBeDisabled();
      await user.clear(field);
      await user.type(field, "yes");
      expect(confirm).toBeEnabled();
      await user.click(confirm);

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(await screen.findByRole("status")).toHaveTextContent(
        `Deleted ${name}.`
      );
      await waitFor(() =>
        expect(screen.queryByRole("listitem", { name })).not.toBeInTheDocument()
      );
      expect(
        (await dmCall("/dm/players")).body.some((p) => p.id === created.id)
      ).toBe(false);
      expect(
        (
          await call("/auth/login", {
            method: "POST",
            body: { username: name, password: created.password },
          })
        ).status
      ).toBe(401);
      expect((await call("/me", { token })).status).toBe(401);
      expect(row("Alice")).toBeInTheDocument(); // everyone else is still there
    });

    it("cancelling deletes nothing", async () => {
      const user = userEvent.setup();
      const name = `Keep${Date.now()}`;
      const created = await createPlayer(name);
      await openPlayers();
      await user.click(
        within(row(name)).getByRole("button", { name: "Delete…" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Type YES to confirm"),
        "yes"
      );
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await loginToken(name, created.password)).toBeTruthy();
    });

    it("treats a player who is already gone as deleted", async () => {
      const user = userEvent.setup();
      const name = `Gone${Date.now()}`;
      const created = await createPlayer(name);
      await openPlayers();
      await dmCall(`/dm/players/${created.id}`, { method: "DELETE" }); // behind the page's back
      await user.click(
        within(row(name)).getByRole("button", { name: "Delete…" })
      );
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Type YES to confirm"),
        "yes"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Delete player" })
      );
      expect(await screen.findByRole("status")).toHaveTextContent(
        `${name} was already deleted.`
      );
      await waitFor(() =>
        expect(screen.queryByRole("listitem", { name })).not.toBeInTheDocument()
      );
    });

    it("moves the Powers page to another player when the selected one is deleted", async () => {
      const user = userEvent.setup();
      const name = `Sel${Date.now()}`;
      await createPlayer(name);
      await openPlayers();
      await user.click(tab("Powers"));
      await user.click(
        await screen.findByRole("button", { name: new RegExp(`^${name}`) })
      );
      expect(await screen.findByRole("heading", { name })).toBeInTheDocument();

      await user.click(tab("Players"));
      await user.click(
        within(await screen.findByRole("listitem", { name })).getByRole(
          "button",
          { name: "Delete…" }
        )
      );
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Type YES to confirm"),
        "yes"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Delete player" })
      );
      await screen.findByRole("status");

      await user.click(tab("Powers"));
      expect(
        await screen.findByRole("heading", { name: "Alice" })
      ).toBeInTheDocument();
      expect(card("Alice")).toHaveAttribute("aria-current", "true");
    });
  });

  describe("names with spaces, accents and apostrophes", () => {
    it("adds, lists and renames them, and the player logs in through the real login form", async () => {
      const user = userEvent.setup();
      const stamp = Date.now();
      const name = `Zoë O'Brien ${stamp}`;
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog", { name: "Add player" });
      expect(within(dialog).getByText(/accents are fine/)).toBeInTheDocument();
      await user.type(within(dialog).getByLabelText("Username"), name);
      await user.type(
        within(dialog).getByLabelText("Password"),
        "zoe-password-1"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );
      await waitFor(() => expect(row(name)).toBeInTheDocument());
      expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no "Created" message any more
      await waitFor(() => expect(row(name)).toBeInTheDocument());

      // rename to another accented, spaced name
      const renamed = `Noël Smith-Jones ${stamp}`;
      await user.click(
        within(row(name)).getByRole("button", { name: "Rename" })
      );
      const rename = await screen.findByRole("dialog");
      const input = within(rename).getByLabelText("New name");
      await user.clear(input);
      await user.type(input, renamed);
      await user.click(
        within(rename).getByRole("button", { name: "Save name" })
      );
      await waitFor(() => expect(row(renamed)).toBeInTheDocument());
      await waitFor(() => expect(row(renamed)).toBeInTheDocument());

      // ...and they can log in with it through the actual login form
      cleanup();
      localStorage.clear();
      renderApp("/login");
      await user.type(await screen.findByLabelText("Username"), renamed);
      await user.type(screen.getByLabelText("Password"), "zoe-password-1");
      await user.click(screen.getByRole("button", { name: "Log in" }));
      expect(await screen.findByAltText("Force Push")).toBeInTheDocument();
    });

    it("treats a name that differs only by accented capitals as taken", async () => {
      const user = userEvent.setup();
      const stamp = Date.now();
      await createPlayer(`Zoë Dupe ${stamp}`);
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Username"),
        `ZOË DUPE ${stamp}`
      );
      await user.type(
        within(dialog).getByLabelText("Password"),
        "long-enough-pw"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );
      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        /taken/i
      );
    });

    it("tidies stray spaces and the curly apostrophe into one canonical name", async () => {
      const user = userEvent.setup();
      const stamp = Date.now();
      await openPlayers();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog");
      await user.type(
        within(dialog).getByLabelText("Username"),
        `Sir   Elk\u2019s ${stamp}`
      );
      await user.type(
        within(dialog).getByLabelText("Password"),
        "long-enough-pw"
      );
      await user.click(
        within(dialog).getByRole("button", { name: "Create player" })
      );

      await waitFor(() =>
        expect(row(`Sir Elk's ${stamp}`)).toBeInTheDocument()
      );
    });
  });

  describe("cleaned-up text", () => {
    it("the page has no subtitle and the Add player dialog is shorter", async () => {
      const user = userEvent.setup();
      await openPlayers();
      expect(screen.queryByText(/Accounts live here/)).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Add player" }));
      const dialog = await screen.findByRole("dialog", { name: "Add player" });
      expect(dialog).toHaveTextContent(/accents are fine/);
      expect(dialog).toHaveTextContent(/8 to 72 characters/);
      expect(dialog).not.toHaveTextContent(/unique even if/);
      expect(dialog).not.toHaveTextContent(/Share it with the player/);
      expect(dialog).not.toHaveTextContent(/New players start with/);
    });

    it("the Rename dialog says only that the login name changes", async () => {
      const user = userEvent.setup();
      await openPlayers();
      await user.click(
        within(row("Alice")).getByRole("button", { name: "Rename" })
      );
      const dialog = await screen.findByRole("dialog", {
        name: "Rename Alice",
      });
      expect(dialog).toHaveTextContent("Their login name changes right away.");
      expect(dialog).not.toHaveTextContent(/Same rules as/);
      expect(dialog).not.toHaveTextContent(/Nobody is signed out/);
    });
  });
});
