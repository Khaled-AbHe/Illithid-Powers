// Integration tests for the DM Powers page: the real React app against the real NestJS API.
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { apiUrl, resetPlayer, setVials } from "../test/apiHelpers";
import {
  aliceClaims,
  card,
  node,
  openPowers as openDm,
  panel,
  ROOT,
  serverAlice,
} from "../test/dmHelpers";

let aliceId;

describe.skipIf(!apiUrl)("DM Powers page", () => {
  beforeEach(async () => {
    aliceId = await resetPlayer("Alice", 4);
    await resetPlayer("Bob", 2);
  });

  describe("players and the brain", () => {
    it("lists every player with their balance and claim count", async () => {
      await openDm();
      expect(card("Alice")).toHaveTextContent("4 vials");
      expect(card("Alice")).toHaveTextContent("1 / 21 powers");
      expect(card("Bob")).toHaveTextContent("2 vials");
      expect(
        screen.queryByRole("button", { name: /^DM/ })
      ).not.toBeInTheDocument();
    });

    it("switches the panel when another player is picked", async () => {
      const user = userEvent.setup();
      await openDm();
      await user.click(card("Bob"));
      expect(
        await screen.findByRole("heading", { name: "Bob" })
      ).toBeInTheDocument();
      expect(card("Bob")).toHaveAttribute("aria-current", "true");
    });

    it("draws the selected player's claimed powers with a pink ring", async () => {
      await aliceClaims("ForcePush");
      await openDm();
      expect(node("Force Push")).toHaveClass("border-pink-500");
      expect(node("Kyara's Influence")).toHaveClass("border-slate-600");
      expect(node("Illithid Identification")).toHaveClass("border-pink-500");
    });

    it("shows a different player's powers when you switch", async () => {
      await aliceClaims("ForcePush");
      const user = userEvent.setup();
      await openDm();
      await user.click(card("Bob"));
      await screen.findByRole("heading", { name: "Bob" });
      expect(node("Force Push")).toHaveClass("border-slate-600");
    });

    it("marks the selected power", async () => {
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      expect(node("Force Push")).toHaveAttribute("aria-pressed", "true");
      expect(node("Kyara's Influence")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });

  describe("vials", () => {
    it("sets the balance on the server", async () => {
      const user = userEvent.setup();
      await openDm();
      const input = screen.getByLabelText("Available vials");
      await user.clear(input);
      await user.type(input, "7");
      await user.click(screen.getByRole("button", { name: "Set vials" }));
      await waitFor(() => expect(card("Alice")).toHaveTextContent("7 vials"));
      expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no confirmation message any more
      expect((await serverAlice()).vials).toBe(7);
      expect(card("Alice")).toHaveTextContent("7 vials");
    });

    it("steps up and down, never below zero", async () => {
      const user = userEvent.setup();
      await openDm();
      const input = screen.getByLabelText("Available vials");
      await user.click(screen.getByRole("button", { name: "One more" }));
      expect(input).toHaveValue("5");
      await user.click(screen.getByRole("button", { name: "One less" }));
      await user.click(screen.getByRole("button", { name: "One less" }));
      expect(input).toHaveValue("3");
      await user.clear(input);
      await user.type(input, "0");
      await user.click(screen.getByRole("button", { name: "One less" }));
      expect(input).toHaveValue("0");
    });

    it("disables Set vials when unchanged or invalid, and explains why", async () => {
      const user = userEvent.setup();
      await openDm();
      const set = screen.getByRole("button", { name: "Set vials" });
      expect(set).toBeDisabled(); // unchanged
      const input = screen.getByLabelText("Available vials");
      for (const bad of ["-1", "2.5", "abc", ""]) {
        await user.clear(input);
        if (bad) await user.type(input, bad);
        expect(set).toBeDisabled();
      }
      expect(screen.getByRole("alert")).toHaveTextContent(/whole number/i);
      expect((await serverAlice()).vials).toBe(4);
    });
  });

  describe("grant", () => {
    it("grants a power whose prerequisite the player has, charging the vials", async () => {
      await aliceClaims("ForcePush"); // 4 -> 3
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Repel")); // needs Force Push
      expect(within(panel()).queryByText(/balance is/)).not.toBeInTheDocument(); // nothing blocks it, so no hint
      await user.click(
        screen.getByRole("button", { name: "Grant Force Repel" })
      );
      await waitFor(() =>
        expect(node("Force Repel")).toHaveClass("border-pink-500")
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument(); // no confirmation message any more
      const alice = await serverAlice();
      expect(alice.claimed).toEqual([ROOT, "ForcePush", "ForceRepel"]);
      expect(alice.vials).toBe(1);
      await waitFor(() =>
        expect(node("Force Repel")).toHaveClass("border-pink-500")
      );
    });

    it("won't grant a power whose requirements aren't met, and says what's needed", async () => {
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Black Hole")); // needs Force Repel
      expect(
        screen.getByRole("button", { name: "Grant Black Hole" })
      ).toBeDisabled();
      expect(
        within(panel()).getByText(/Needs Force Repel first/)
      ).toBeInTheDocument();
      expect(within(panel()).queryByText(/Skips requirements/)).toBeNull();
      expect((await serverAlice()).claimed).toEqual([ROOT]);
    });

    it("disables Grant when the balance is too low, and says by how much", async () => {
      await aliceClaims("ForcePush"); // 4 -> 3
      await setVials(aliceId, 1);
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Repel")); // requirement met, costs 2
      expect(
        screen.getByRole("button", { name: "Grant Force Repel" })
      ).toBeDisabled();
      expect(within(panel()).getByText(/Short by 1 vial/)).toBeInTheDocument();
    });

    it("when the screen is stale the server refuses, the DM is told, and the balance corrects itself", async () => {
      await aliceClaims("ForcePush");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Repel"));
      await setVials(aliceId, 0); // changed behind the screen's back
      await user.click(
        screen.getByRole("button", { name: "Grant Force Repel" })
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /not enough vials/i
      );
      await waitFor(() => expect(card("Alice")).toHaveTextContent("0 vials"));
      expect((await serverAlice()).claimed).toEqual([ROOT, "ForcePush"]);
    });

    it("the server still refuses if the requirement disappeared behind the screen's back", async () => {
      await aliceClaims("ForcePush");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Repel")); // enabled: Alice has Force Push
      await resetPlayer("Alice", 4); // ...and then she doesn't
      await user.click(
        screen.getByRole("button", { name: "Grant Force Repel" })
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /missing requirements/i
      );
      expect((await serverAlice()).claimed).toEqual([ROOT]);
    });
  });

  describe("revoke", () => {
    beforeEach(async () => {
      await setVials(aliceId, 6);
    });

    it("previews the cascade in the panel before anything is opened", async () => {
      await aliceClaims("ForcePush", "ForceRepel", "BlackHole");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      expect(
        await screen.findByText(/Revoking also removes/)
      ).toHaveTextContent(
        "Revoking also removes Force Repel and Black Hole. 6 vials come back."
      );
    });

    it("shows exactly what will go, asks for YES, then revokes and refunds", async () => {
      await aliceClaims("ForcePush", "ForceRepel", "BlackHole");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      await user.click(await screen.findByRole("button", { name: /^Revoke/ }));

      const dialog = await screen.findByRole("dialog", {
        name: "Revoke Force Push?",
      });
      await within(dialog).findByRole("button", { name: "Revoke 3 powers" });
      expect(
        within(dialog).queryByText(/will be removed/)
      ).not.toBeInTheDocument();
      expect(within(dialog).queryByText("Selected")).not.toBeInTheDocument();
      for (const name of ["Force Push", "Force Repel", "Black Hole"]) {
        expect(within(dialog).getByText(name)).toBeInTheDocument();
      }
      expect(
        within(dialog).getByText(/6 vials · balance 0 → 6/)
      ).toBeInTheDocument();

      const confirm = within(dialog).getByRole("button", {
        name: "Revoke 3 powers",
      });
      expect(confirm).toBeDisabled();
      await user.type(
        within(dialog).getByLabelText("Type YES to confirm"),
        "no"
      );
      expect(confirm).toBeDisabled();
      await user.clear(within(dialog).getByLabelText("Type YES to confirm"));
      await user.type(
        within(dialog).getByLabelText("Type YES to confirm"),
        "yes"
      );
      expect(confirm).toBeEnabled();
      await user.click(confirm);

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      );
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Removed 3 powers from Alice, refunded 6 vials."
      );
      const alice = await serverAlice();
      expect(alice.claimed).toEqual([ROOT]);
      expect(alice.vials).toBe(6);
      await waitFor(() =>
        expect(node("Force Push")).toHaveClass("border-slate-600")
      );
    });

    it("says what is spared and why", async () => {
      await setVials(aliceId, 10);
      await aliceClaims("ForcePush", "KyarasInfluence", "PsionicBacklash");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      await user.click(await screen.findByRole("button", { name: /^Revoke/ }));
      const dialog = await screen.findByRole("dialog");
      expect(
        (await within(dialog).findByText(/Stays:/)).closest("p")
      ).toHaveTextContent(
        "Stays: Psionic Backlash, because Kyara's Influence is still claimed."
      );
      expect(
        within(dialog).getByRole("button", { name: "Revoke 1 power" })
      ).toBeInTheDocument();
    });

    it("cancelling revokes nothing", async () => {
      await aliceClaims("ForcePush");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      await user.click(await screen.findByRole("button", { name: /^Revoke/ }));
      const dialog = await screen.findByRole("dialog");
      await within(dialog).findByRole("button", { name: "Revoke 1 power" });
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect((await serverAlice()).claimed).toEqual([ROOT, "ForcePush"]);
    });

    it("offers no revoke for the root power", async () => {
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Illithid Identification"));
      expect(within(panel()).getByText(/can't be revoked/)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Revoke/ })
      ).not.toBeInTheDocument();
    });

    it("tells the DM when the player no longer has the power, and offers no revoke", async () => {
      await aliceClaims("ForcePush");
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push"));
      const revokeButton = await screen.findByRole("button", {
        name: /^Revoke/,
      });
      await resetPlayer("Alice", 4); // gone behind the screen's back
      await user.click(revokeButton);
      const dialog = await screen.findByRole("dialog");
      expect(
        await within(dialog).findByText(/no longer has this power/)
      ).toBeInTheDocument();
      expect(
        within(dialog).queryByRole("button", { name: /^Revoke \d/ })
      ).not.toBeInTheDocument();
    });
  });

  describe("what this page no longer does", () => {
    it("has no account controls: those live on the Players page", async () => {
      await openDm();
      expect(
        screen.queryByRole("button", { name: "Add player" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Reset password" })
      ).not.toBeInTheDocument();
    });
  });

  describe("reset player", () => {
    it("resets a player straight away, with no confirmation", async () => {
      await setVials(aliceId, 6);
      await aliceClaims("ForcePush", "ForceRepel");
      const user = userEvent.setup();
      await openDm();
      await user.click(screen.getByRole("button", { name: "Reset player" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Reset Alice: 2 powers removed, vials set to 0."
      );
      const alice = await serverAlice();
      expect(alice.claimed).toEqual([ROOT]);
      expect(alice.vials).toBe(0);
    });
  });

  describe("refreshing", () => {
    it("picks up changes made elsewhere when the window regains focus, and not before", async () => {
      await openDm();
      expect(card("Alice")).toHaveTextContent("4 vials");
      await aliceClaims("ForcePush"); // the player acts on their own phone
      expect(card("Alice")).toHaveTextContent("4 vials"); // manual: nothing updates by itself
      window.dispatchEvent(new Event("focus"));
      await waitFor(() => expect(card("Alice")).toHaveTextContent("3 vials"));
      expect(card("Alice")).toHaveTextContent("2 / 21 powers");
    });
  });

  describe("cleaned-up text", () => {
    it("no longer shows the legend, the claim-count line or the vials hint", async () => {
      await openDm();
      expect(screen.queryByText(/Pink ring/)).not.toBeInTheDocument();
      expect(
        within(panel()).queryByText(/powers claimed/)
      ).not.toBeInTheDocument();
      expect(
        within(panel()).queryByText(/Only you can change this/)
      ).not.toBeInTheDocument();
    });

    it("only explains a blocked grant, and says nothing when it is fine", async () => {
      const user = userEvent.setup();
      await openDm();
      await user.click(node("Force Push")); // needs only the root; Alice has 4 vials
      expect(
        screen.getByRole("button", { name: "Grant Force Push" })
      ).toBeEnabled();
      expect(
        within(panel()).queryByText(/balance is|Short by|Needs/)
      ).not.toBeInTheDocument();
      await user.click(node("Black Hole")); // needs Force Repel
      expect(
        within(panel()).getByText(/Needs Force Repel first\./)
      ).toBeInTheDocument();
    });
  });
});
