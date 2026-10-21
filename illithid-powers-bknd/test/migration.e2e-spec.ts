import { afterEach, describe, expect, it } from '@jest/globals';
import { Client, createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REAL = join(__dirname, '../drizzle');
const OWNERSHIP_SQL = readFileSync(join(REAL, readdirSync(REAL).find((f) => f.includes('player_ownership'))!), 'utf8');

/** A migrations folder holding only the first migration: the database as it was before ownership existed. */
function firstMigrationOnly(dir: string) {
  const out = join(dir, 'first');
  mkdirSync(join(out, 'meta'), { recursive: true });
  const journal = JSON.parse(readFileSync(join(REAL, 'meta/_journal.json'), 'utf8'));
  journal.entries = journal.entries.slice(0, 1);
  writeFileSync(join(out, 'meta/_journal.json'), JSON.stringify(journal));
  const first = readdirSync(REAL).find((f) => f.startsWith('0000_'))!;
  cpSync(join(REAL, first), join(out, first));
  return out;
}

describe('player ownership migration', () => {
  const dirs: string[] = [];
  const clients: Client[] = [];
  afterEach(() => {
    clients.splice(0).forEach((c) => c.close());
    dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true }));
  });

  /** A database exactly as it was before this migration, ready to be loaded with legacy data. */
  async function legacyDb() {
    const dir = mkdtempSync(join(tmpdir(), 'illithid-mig-'));
    dirs.push(dir);
    const client = createClient({ url: `file:${join(dir, 'db.sqlite')}` });
    clients.push(client);
    await migrate(drizzle(client), { migrationsFolder: firstMigrationOnly(dir) });
    const run = (sql: string, args: unknown[] = []) => client.execute({ sql, args: args as any });
    const user = async (username: string, role: string, vials = 0) =>
      Number((await run('insert into users (username, password_hash, role, vials) values (?, ?, ?, ?) returning id', [username, 'x', role, vials])).rows[0].id);
    const migrateToLatest = () => migrate(drizzle(client), { migrationsFolder: REAL });
    const owners = async () =>
      Object.fromEntries((await run('select username, dm_id from users')).rows.map((r) => [r.username, r.dm_id]));
    return { client, run, user, migrateToLatest, owners };
  }

  it('gives every existing player to the existing DM and leaves the DM itself unowned', async () => {
    const { user, migrateToLatest, owners } = await legacyDb();
    const dm = await user('DM', 'dm');
    await user('Srosu', 'player', 3);
    await user('Elk', 'player', 1);
    await migrateToLatest();
    expect(await owners()).toEqual({ DM: null, Srosu: dm, Elk: dm });
  });

  it("keeps everything else: balances, claimed powers and passwords", async () => {
    const { run, user, migrateToLatest } = await legacyDb();
    await user('DM', 'dm');
    const p = await user('Srosu', 'player', 7);
    await run("insert into abilities (key, name, description, vial_cost, requires) values ('ForcePush', 'Force Push', 'd', 1, '[]')");
    await run("insert into user_abilities (user_id, ability_key) values (?, 'ForcePush')", [p]);
    await migrateToLatest();
    const row = (await run('select vials, password_hash from users where id = ?', [p])).rows[0];
    expect(row).toMatchObject({ vials: 7, password_hash: 'x' });
    expect((await run('select count(*) as n from user_abilities where user_id = ?', [p])).rows[0].n).toBe(1);
  });

  it('succeeds on a database with no DM, leaving players unowned', async () => {
    const { user, migrateToLatest, owners } = await legacyDb();
    await user('Srosu', 'player');
    await migrateToLatest();
    expect(await owners()).toEqual({ Srosu: null });
  });

  it('succeeds on an empty database', async () => {
    const { migrateToLatest, owners } = await legacyDb();
    await migrateToLatest();
    expect(await owners()).toEqual({});
  });

  it('with several DMs, existing players go to the first one', async () => {
    const { user, migrateToLatest, owners } = await legacyDb();
    const first = await user('First', 'dm');
    await user('Second', 'dm');
    await user('Srosu', 'player');
    await migrateToLatest();
    expect((await owners()).Srosu).toBe(first);
  });

  it('is safe to run again, and never takes a player away from the DM who owns them', async () => {
    const { run, user, migrateToLatest, owners } = await legacyDb();
    await user('First', 'dm');
    const second = await user('Second', 'dm');
    await user('Srosu', 'player');
    await migrateToLatest();
    await run('update users set dm_id = ? where username = ?', [second, 'Srosu']); // reassigned afterwards
    await migrateToLatest(); // already applied: nothing happens
    expect((await owners()).Srosu).toBe(second);
    // and the backfill statement on its own only fills players that have no owner
    const backfill = OWNERSHIP_SQL.split('--> statement-breakpoint').pop()!;
    await run(backfill);
    expect((await owners()).Srosu).toBe(second);
  });

  it('adds an index on the owner column and enforces that an owner must exist', async () => {
    const { run, migrateToLatest } = await legacyDb();
    await migrateToLatest();
    const idx = (await run("select name from sqlite_master where type = 'index' and name = 'users_dm_id_idx'")).rows;
    expect(idx).toHaveLength(1);
    await expect(
      run("insert into users (username, password_hash, role, dm_id) values ('x', 'x', 'player', 99999)"),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});
