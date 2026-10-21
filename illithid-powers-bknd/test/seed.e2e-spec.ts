import { describe, expect, it } from '@jest/globals';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

function run(script: string, env: Record<string, string>) {
  return spawnSync(join(ROOT, 'node_modules/.bin/tsx'), [script], {
    cwd: ROOT,
    env: { PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
  });
}

async function freshDb() {
  const dir = mkdtempSync(join(tmpdir(), 'illithid-seed-'));
  const url = `file:${join(dir, 'db.sqlite')}`;
  const client = createClient({ url });
  await migrate(drizzle(client), { migrationsFolder: join(ROOT, 'drizzle') });
  const count = async (table: string) => Number((await client.execute(`select count(*) as n from ${table}`)).rows[0].n);
  return { dir, url, client, count };
}

describe('seeding', () => {
  it('db:seed syncs the ability catalog and creates no accounts, even if account settings are present', async () => {
    const db = await freshDb();
    const res = run('src/db/seed.ts', {
      TURSO_DATABASE_URL: db.url,
      // the old account settings are simply ignored now
      DM_PASSWORD: 'x', SEED_PLAYERS: 'Someone', PLAYER_PASSWORD_SOMEONE: 'x',
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Abilities synced: 21');
    expect(await db.count('abilities')).toBe(21);
    expect(await db.count('users')).toBe(0);
    // safe to re-run
    expect(run('src/db/seed.ts', { TURSO_DATABASE_URL: db.url }).status).toBe(0);
    expect(await db.count('abilities')).toBe(21);
    db.client.close();
    rmSync(db.dir, { recursive: true, force: true });
  }, 60000);

  it('the test-accounts script refuses to run outside test mode, and writes nothing', async () => {
    const db = await freshDb();
    const env = { TURSO_DATABASE_URL: db.url, DM_PASSWORD: 'dm-password-1', SEED_PLAYERS: 'Alice', PLAYER_PASSWORD_ALICE: 'alice-password-1' };
    for (const nodeEnv of [undefined, 'production', 'development']) {
      const res = spawnSync(join(ROOT, 'node_modules/.bin/tsx'), ['src/db/seed-test-accounts.ts'], {
        cwd: ROOT,
        env: { PATH: process.env.PATH ?? '', ...env, ...(nodeEnv ? { NODE_ENV: nodeEnv } : {}) },
        encoding: 'utf8',
      });
      expect(res.status).not.toBe(0);
      expect(res.stderr).toMatch(/only runs with NODE_ENV=test/);
    }
    expect(await db.count('users')).toBe(0);
    db.client.close();
    rmSync(db.dir, { recursive: true, force: true });
  }, 60000);

  it('in test mode it creates a DM and players owned by that DM, and is safe to re-run', async () => {
    const db = await freshDb();
    run('src/db/seed.ts', { TURSO_DATABASE_URL: db.url });
    const env = {
      TURSO_DATABASE_URL: db.url, NODE_ENV: 'test',
      DM_PASSWORD: 'dm-password-1', SEED_PLAYERS: 'Alice,Bob',
      PLAYER_PASSWORD_ALICE: 'alice-password-1', PLAYER_PASSWORD_BOB: 'bob-password-1',
    };
    expect(run('src/db/seed-test-accounts.ts', env).status).toBe(0);
    expect(run('src/db/seed-test-accounts.ts', env).status).toBe(0);
    const rows = (await db.client.execute("select u.username, u.role, d.username as owner from users u left join users d on d.id = u.dm_id order by u.id")).rows;
    expect(rows.map((r) => [r.username, r.role, r.owner])).toEqual([
      ['DM', 'dm', null],
      ['Alice', 'player', 'DM'],
      ['Bob', 'player', 'DM'],
    ]);
    expect(await db.count('user_abilities')).toBe(2); // each player owns the free root power
    db.client.close();
    rmSync(db.dir, { recursive: true, force: true });
  }, 60000);
});
