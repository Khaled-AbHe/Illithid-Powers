import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { retireDm } from '../src/db/retire-dm';
import { userAbilities, users } from '../src/db/schema';
import { createTestApp, ROOT_KEY, TestApp } from './helpers';

describe('retiring a DM account', () => {
  let t: TestApp;
  let oldDm: number;
  let otherDm: number;
  let n = 0;
  const count = async (table: typeof users | typeof userAbilities) => (await t.db.select().from(table)).length;

  beforeEach(async () => {
    if (t) await t.close();
    t = await createTestApp();
    n++;
    oldDm = await t.createUser({ username: 'old-dm', role: 'dm' });
    otherDm = await t.createUser({ username: 'other-dm', role: 'dm' });
    // two players for the old DM (one with a claimed power and vials), one for the other DM
    await t.createUser({ username: 'old-1', dmId: oldDm, vials: 5 });
    await t.createUser({ username: 'old-2', dmId: oldDm });
    await t.createUser({ username: 'keep-1', dmId: otherDm, vials: 2 });
    const [o1] = await t.db.select().from(users).where(eq(users.username, 'old-1'));
    await t.db.insert(userAbilities).values({ userId: o1.id, abilityKey: 'ForcePush' });
  });
  afterAll(() => t?.close());

  it('a dry run reports exactly what would go and deletes nothing', async () => {
    const before = { users: await count(users), claims: await count(userAbilities) };
    const report = await retireDm(t.db, { dmUsername: 'old-dm', execute: false });
    expect(report.executed).toBe(false);
    expect(report.dm.username).toBe('old-dm');
    expect(report.otherDms).toBe(1);
    expect(report.players.map((p) => [p.username, p.powers, p.vials]).sort()).toEqual([
      ['old-1', 1, 5], // the free root power isn't counted
      ['old-2', 0, 0],
    ]);
    expect({ users: await count(users), claims: await count(userAbilities) }).toEqual(before);
  });

  it('deletes the DM, its players and their claimed powers, and nothing else', async () => {
    const report = await retireDm(t.db, { dmUsername: 'old-dm', execute: true });
    expect(report.executed).toBe(true);
    const names = (await t.db.select({ u: users.username }).from(users)).map((r) => r.u).sort();
    expect(names).toEqual(['keep-1', 'other-dm']);
    // the other DM's player kept everything, including the free root power
    const [keep] = await t.db.select().from(users).where(eq(users.username, 'keep-1'));
    expect(keep).toMatchObject({ vials: 2, dmId: otherDm });
    const claims = await t.db.select().from(userAbilities);
    expect(claims.map((c) => [c.userId, c.abilityKey])).toEqual([[keep.id, ROOT_KEY]]);
  });

  it('the deleted accounts can no longer log in', async () => {
    const token = await t.tokenFor('old-1');
    await retireDm(t.db, { dmUsername: 'old-dm', execute: true });
    await t.login('old-dm').expect(401);
    await t.login('old-1').expect(401);
    await t.http().get('/me').set({ Authorization: `Bearer ${token}` }).expect(401);
    await t.login('keep-1').expect(200);
  });

  it('refuses to delete the only DM account unless explicitly allowed, because nobody could sign in afterwards', async () => {
    await retireDm(t.db, { dmUsername: 'old-dm', execute: true }); // leaves other-dm as the only DM
    await expect(retireDm(t.db, { dmUsername: 'other-dm', execute: true })).rejects.toThrow(/only DM account/);
    expect(await t.db.select().from(users).where(eq(users.username, 'other-dm'))).toHaveLength(1);
    const forced = await retireDm(t.db, { dmUsername: 'other-dm', execute: true, allowNoOtherDm: true });
    expect(forced.executed).toBe(true);
    expect(await count(users)).toBe(0);
  });

  it('refuses a player account or an unknown name', async () => {
    await expect(retireDm(t.db, { dmUsername: 'keep-1', execute: true })).rejects.toThrow(/not a DM account/);
    await expect(retireDm(t.db, { dmUsername: 'nobody', execute: true })).rejects.toThrow(/No account named/);
    expect(await count(users)).toBe(5);
  });

  it('is a no-op the second time (the account is gone)', async () => {
    await retireDm(t.db, { dmUsername: 'old-dm', execute: true });
    await expect(retireDm(t.db, { dmUsername: 'old-dm', execute: true })).rejects.toThrow(/No account named/);
  });
});
