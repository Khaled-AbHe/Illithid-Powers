# Illithid Powers API

NestJS 11 + Drizzle ORM + Turso (libSQL). Done so far: schema, migration, seed (step 1), auth (step 2) and player endpoints (step 3), DM endpoints (step 4) and the revoke preview (step 6a), requirement enforcement for DM grants, and player rename and delete (step 2b).

## Setup
```bash
npm install
cp .env.example .env        # set JWT_SECRET, GOOGLE_CLIENT_ID (and the Turso URL and token if you use Turso)
npm run db:migrate          # applies ./drizzle migrations to TURSO_DATABASE_URL
npm run db:seed             # syncs the ability catalog (creates no accounts)
npm run start:dev           # http://localhost:3000/health
```
Local dev uses `TURSO_DATABASE_URL=file:local.db`. For Turso, set the `libsql://...` URL and `TURSO_AUTH_TOKEN`.

## Scripts
| Script | Purpose |
|---|---|
| `db:extract` | Regenerate `src/db/abilities.seed.json` from the frontend's `data.js` |
| `db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `db:migrate` | Apply migrations |
| `db:seed` | Syncs the ability catalog (the powers). Safe to re-run. Creates no accounts |
| `db:seed-test-accounts` | TEST ONLY: creates a DM and players for local tries and the frontend's integration tests. Refuses to run unless `NODE_ENV=test` |
| `db:retire-dm` | Deletes a DM account and its players (dry run unless `--yes`). See below |
| `db:studio` | Drizzle Studio |
| `test` | Unit + e2e tests (e2e uses a throwaway DB file, never your `local.db`); `test:e2e` is an alias |

## Players belong to a DM
Every player is owned by the DM who created them (`users.dm_id`). Every `/dm/...` route only sees and changes the calling DM's own players. Asking about another DM's player (or one that doesn't exist, or an account with no owner) is an identical 404, so a DM can't learn whether someone else's player exists. Player names stay unique across the whole app (case-insensitively), because a player logs in with just a name.

### Deploying the migrations (`0001_player_ownership`, `0002_google_sign_in`)
`0001` adds a nullable `dm_id` column and an index, then assigns every existing player to the existing DM (the first DM account), so nothing is orphaned and that DM keeps working. It is safe to run on a database that has no DM, no players, or several DMs. `0002` adds a nullable `google_sub` column with a unique index and changes no data. **Make a copy of your Turso database first**, run `npm run db:migrate` (it applies both), and only then deploy the new code.

### Retiring the old DM account
Once Google sign-in is live and you have signed in with another DM account, delete the old password-based DM and its players:
```bash
npm run db:retire-dm -- --dm DM           # dry run: lists the DM and every player that would go
npm run db:retire-dm -- --dm DM --yes     # actually deletes them (one transaction)
```
It refuses to delete a player account, an unknown name, or the **only** DM account (pass `--allow-no-other-dm` to override), because nobody could sign in as a DM afterwards. It does not run as part of a migration, so a deploy can never delete data.

## Auth
- **Players** log in with `POST /auth/login` and `{ username, password }`, which returns `{ accessToken, user }`. Send the token as `Authorization: Bearer <token>`.
- **DMs** sign in with Google: `POST /auth/google` with `{ credential }` (the ID token the browser got from Google) returns the same shape. The first time a Google account signs in, a DM account is created for it. See "Google sign-in for DMs" below.
- Every route needs a valid token unless marked `@Public()` (currently `/auth/login`, `/auth/google` and `/health`).
- `@Roles('dm')` restricts a route to the DM. Both guards are global.
- The guard reads the user from the DB on each request, so a deleted user or a changed role takes effect immediately, even for tokens already issued.
- `GET /me` returns `{ id, username, role, vials }`.
- Env: `JWT_SECRET` (required; 32+ random chars in production), `JWT_EXPIRES_IN` (default `7d`).

## Google sign-in for DMs
**How it works.** The login page shows Google's "Continue with Google" button. Google hands the browser a signed ID token, the browser sends it to `POST /auth/google`, and the server verifies it with Google's own library: the signature against Google's published keys, that it hasn't expired, that Google issued it, and that it was issued for **your** client ID (a token issued to some other app is refused). Google must also say the email is verified. The account is keyed on Google's stable user id, so a DM keeps their account and players if their email changes. Their username is their email address (lowercased); they have no password at all, so there is nothing to reset or recover (Google handles that). Players are never created this way.

**Setup (you do this once).** The exact wording in Google's console changes over time, but the steps are:
1. In the Google Cloud Console, create (or pick) a project.
2. Configure the OAuth consent screen. While it is in "Testing" only the test users you list can sign in, so to let any Google account sign in, set its publishing status to "In production". The basic scopes (openid, email, profile) don't need Google's review.
3. Create an **OAuth client ID** of type **Web application**. Under "Authorized JavaScript origins" add the address of your frontend (for example `https://your-site.example`) and `http://localhost:5173` for development. No redirect URI and no client secret are needed.
4. Put the client ID in two places: `GOOGLE_CLIENT_ID` for this API, and `VITE_GOOGLE_CLIENT_ID` for the frontend (it is read when the frontend is built, so rebuild after setting it).

Until `GOOGLE_CLIENT_ID` is set, `POST /auth/google` answers 503 "Google sign-in is not configured on this server", and the frontend hides the button when its own variable is empty.

**Not tested against real Google.** The tests use a fake check that accepts `fake:<id>:<email>:<true|false>`. It is only used when `NODE_ENV=test` **and** `GOOGLE_VERIFIER=fake`, so it cannot be switched on in a real deployment. The real handshake (the button, Google's token, the signature check) can only be confirmed by trying it with your client ID.

## Rate limiting
`POST /auth/login` and `POST /auth/google` allow `AUTH_RATE_LIMIT` attempts (default 20) per `AUTH_RATE_WINDOW_SECONDS` (default 60) per IP address, whether or not the attempt succeeds. Over the limit the answer is `429` "Too many attempts. Please wait a minute and try again." with a `Retry-After` header. Other routes are not limited.
- The counters are held in memory: they reset when the server restarts and are not shared between several running copies.
- **Behind a reverse proxy** (most hosts), every request appears to come from the proxy, so everyone would share one allowance. Set `TRUST_PROXY` to the number of proxies in front of the app (usually `1`) so the real address is read from `X-Forwarded-For`. Leave it empty if the app is reachable directly. Don't set it to more proxies than you have, or the address can be forged.
- Several people on one network (a whole table on the same Wi-Fi) share one address, so the default leaves room for them. Raise `AUTH_RATE_LIMIT` if needed; the Postman collection logs in about 10 times per run.

## Player endpoints
| Route | Notes |
|---|---|
| `GET /abilities` | Catalog: `key, name, description, vialCost, requires` (any-of), cheapest first |
| `GET /me/abilities` | Keys the caller has claimed, in claim order |
| `POST /me/abilities/:key/claim` | Players only. Returns `{ key, alreadyClaimed, charged, vials }` |

Claim errors: `404` unknown key; `403` with `code: "MISSING_REQUIREMENTS"` (plus `requires`) or `code: "NOT_ENOUGH_VIALS"` (plus `needed`, `available`, `shortfall`). Missing requirements is reported before missing vials. Claiming something already owned is a free no-op (200).

The claim runs in one transaction with a conditional balance update, so simultaneous requests can't spend the same vials twice.

## DM endpoints (role `dm` only; targets must be players)
| Route | Notes |
|---|---|
| `GET /dm/players` | Players with `vials` and `claimed` keys |
| `POST /dm/players` | `{ username, password }`; creates a player with 0 vials and the root ability. 409 if the name exists (case-insensitive) |
| `PATCH /dm/players/:id` | Rename: `{ username }`, same rules as create. 409 if another account has the name (ignoring capitals; changing only your own capitals is fine). Sessions keep working |
| `DELETE /dm/players/:id` | Permanently deletes the player and their claimed powers, 204. Players only (the DM account is a 404). Their tokens stop working immediately, and ids are never reused |
| `PATCH /dm/players/:id/password` | `{ password }` (8-72 chars), 204 |
| `PATCH /dm/players/:id/vials` | `{ available }` integer 0 to 1,000,000. The only way a balance is set directly |
| `PUT /dm/players/:id/abilities/:key` | Grant on the player's behalf. Same rules as their own claim: needs a prerequisite (403 `MISSING_REQUIREMENTS`) and enough vials (403 `NOT_ENOUGH_VIALS`). The DM cannot bypass requirements |
| `GET /dm/players/:id/abilities/:key/revoke-preview` | Read-only: what a revoke would do. `{ key, owned, removed: [{key,name,vialCost}], refund, vials, vialsAfter, kept: [{key,name,via}] }`. `kept` lists abilities spared because another prerequisite is still owned |
| `DELETE /dm/players/:id/abilities/:key` | Revoke with cascade and refund: `{ removed, refunded, vials }` |
| `POST /dm/players/:id/reset` | Removes everything except the root and sets vials to 0 |

The preview and the revoke share one query and one cascade function, and a test checks that they always agree.

Revoke rules: an ability is removed along with the revoked one only if it depended on something being removed and has no other owned prerequisite (any-of). Abilities that were already unsupported before the revoke (only possible from data created before grants had to follow the requirements) are left alone. The root can't be revoked (400); revoking something not owned is a no-op (200, nothing removed).

## Player names
Letters of any language (accents are fine), numbers, and `. - _ '`, with single spaces between words; 1 to 64 characters, at least one letter or number. No control characters, emoji or invisible characters.

Names are stored in one canonical form (accents composed, the curly apostrophe straightened, stray spaces trimmed or collapsed), and login normalizes the same way, so how a name was typed doesn't matter. "Is this name taken?" ignores capitals and is checked in code, not SQL, because SQLite's `lower()` only folds plain ASCII (it would treat `ZOË` and `Zoë` as different names). Login itself is still case-sensitive.

## Notes
- `BCRYPT_ROUNDS` (default 12) is lowered to 4 by the tests only.
- Pinned to Nest 11 (CommonJS): Nest 12 is ESM-only.
- Vial balance lives on `users.vials`; `user_abilities` holds claims; `abilities.requires` is an any-of key list.
