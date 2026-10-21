// Starts the real NestJS API for the integration tests, on a throwaway database.
// Set API_DIR to the backend folder (built with `npm run build`, dependencies installed):
//   API_DIR=../illithid_powers_api npm test
// Without API_DIR the integration tests are skipped and the unit tests still run.
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const PORT = 3101;

async function waitForHealth(url, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error("API exited during startup");
    try {
      if ((await fetch(`${url}/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("API did not become healthy in time");
}

export default async function setup({ provide }) {
  if (!process.env.API_DIR) {
    provide("apiUrl", null);
    return;
  }
  const apiDir = resolve(process.env.API_DIR);
  if (!existsSync(join(apiDir, "dist", "main.js"))) {
    throw new Error(
      `No built API found in ${apiDir}. Run "npm install" and "npm run build" there first.`
    );
  }
  const dir = mkdtempSync(join(tmpdir(), "illithid-fe-"));
  const env = {
    ...process.env,
    TURSO_DATABASE_URL: `file:${join(dir, "test.db")}`,
    TURSO_AUTH_TOKEN: "",
    JWT_SECRET: "frontend-test-secret",
    NODE_ENV: "test",
    BCRYPT_ROUNDS: "4",
    // the tests log in constantly from one address
    AUTH_RATE_LIMIT: "100000",
    GOOGLE_VERIFIER: "fake",
    PORT: String(PORT),
    CORS_ORIGIN: "http://localhost:5173",
    DM_PASSWORD: "dm-pw",
    SEED_PLAYERS: "Alice,Bob",
    PLAYER_PASSWORD_ALICE: "alice-pw",
    PLAYER_PASSWORD_BOB: "bob-pw",
  };

  execSync("npx drizzle-kit migrate", { cwd: apiDir, env, stdio: "pipe" });
  // The catalog (the powers), then the test-only accounts: a DM and two players.
  execSync("npm run -s db:seed", { cwd: apiDir, env, stdio: "pipe" });
  execSync("npm run -s db:seed-test-accounts", {
    cwd: apiDir,
    env,
    stdio: "pipe",
  });
  const child = spawn(process.execPath, ["dist/main.js"], {
    cwd: apiDir,
    env,
    // Set API_LOG=/some/file to keep the API's output when debugging a failing test.
    stdio: process.env.API_LOG
      ? [
          "ignore",
          openSync(process.env.API_LOG, "a"),
          openSync(process.env.API_LOG, "a"),
        ]
      : "ignore",
  });

  const url = `http://localhost:${PORT}`;
  await waitForHealth(url, child);
  provide("apiUrl", url);

  return () => {
    child.kill();
    rmSync(dir, { recursive: true, force: true });
  };
}
