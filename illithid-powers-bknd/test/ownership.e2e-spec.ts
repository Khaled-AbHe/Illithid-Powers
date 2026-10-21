import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { userAbilities, users } from '../src/db/schema';
import { createTestApp, ROOT_KEY, TestApp } from './helpers';

/** Two DMs, each with their own players. No DM may see or touch the other's. */
describe('DM ownership of players (e2e)', () => {
  let t: TestApp;
  let a: { id: number; auth: { Authorization: string } };
  let b: { id: number; auth: { Authorization: string } };
  let aPlayer: { id: number; username: string; password: string };
  let bPlayer: { id: number; username: string };

  const as = (dm: { auth: { Authorization: string } }) => ({
    get: (url: string) => t.http().get(url).set(dm.auth),
    post: (url: string, body?: object) => t.http().post(url).set(dm.auth).send(body),
    patch: (url: string, body?: object) => t.http().patch(url).set(dm.auth).send(body),
    put: (url: string) => t.http().put(url).set(dm.auth),
    delete: (url: string) => t.http().delete(url).set(dm.auth),
  });

  beforeAll(async () => {
    t = await createTestApp();
    const aId = await t.createUser({ username: 'dm-a', role: 'dm' });
    const bId = await t.createUser({ username: 'dm-b', role: 'dm' });
    a = { id: aId, auth: { Authorization: `Bearer ${await t.tokenFor('dm-a')}` } };
    b = { id: bId, auth: { Authorization: `Bearer ${await t.tokenFor('dm-b')}` } };

    // Created through the real endpoint, so ownership comes from the route itself.
    const mk = async (dm: typeof a, username: string, password: string) =>
      (await as(dm).post('/dm/players', { username, password }).expect(201)).body as { id: number; username: string };
    aPlayer = { ...(await mk(a, 'a-one', 'a-one-password')), password: 'a-one-password' };
    await mk(a, 'a-two', 'a-two-password');
    bPlayer = await mk(b, 'b-one', 'b-one-password');

    // Give A's player some state worth protecting.
    await as(a).patch(`/dm/players/${aPlayer.id}/vials`, { available: 5 }).expect(200);
    const token = await t.tokenFor('a-one', 'a-one-password');
    await t.http().post('/me/abilities/ForcePush/claim').set({ Authorization: `Bearer ${token}` }).expect(200);
  });
  afterAll(() => t.close());

  describe('listing and creating', () => {
    it('each DM sees only their own players', async () => {
      const mine = (dm: typeof a) => as(dm).get('/dm/players').expect(200).then((r) => r.body.map((p: any) => p.username).sort());
      expect(await mine(a)).toEqual(['a-one', 'a-two']);
      expect(await mine(b)).toEqual(['b-one']);
    });

    it('a new DM starts with no players', async () => {
      await t.createUser({ username: 'dm-new', role: 'dm' });
      const token = await t.tokenFor('dm-new');
      const res = await t.http().get('/dm/players').set({ Authorization: `Bearer ${token}` }).expect(200);
      expect(res.body).toEqual([]);
    });

    it('a created player is owned by the DM who created them', async () => {
      const [row] = await t.db.select().from(users).where(eq(users.id, aPlayer.id));
      expect(row.dmId).toBe(a.id);
      const [other] = await t.db.select().from(users).where(eq(users.id, bPlayer.id));
      expect(other.dmId).toBe(b.id);
    });

    it('player names stay unique across all DMs, ignoring capitals', async () => {
      await as(b).post('/dm/players', { username: 'a-one', password: 'long-enough-pw' }).expect(409);
      await as(b).post('/dm/players', { username: 'A-ONE', password: 'long-enough-pw' }).expect(409);
      await as(b).patch(`/dm/players/${bPlayer.id}`, { username: 'a-two' }).expect(409);
    });

    it("a DM's username can't be taken by a player either", async () => {
      await as(a).post('/dm/players', { username: 'DM-B', password: 'long-enough-pw' }).expect(409);
    });
  });

  describe("one DM can't touch another DM's player", () => {
    // every row has all three values (jest would read a missing one as a `done` callback)
    const routes: [string, (id: number) => string, object | undefined][] = [
      ['PATCH', (id) => `/dm/players/${id}`, { username: 'stolen' }],
      ['DELETE', (id) => `/dm/players/${id}`, undefined],
      ['PATCH', (id) => `/dm/players/${id}/password`, { password: 'hijacked-pw-1' }],
      ['PATCH', (id) => `/dm/players/${id}/vials`, { available: 99 }],
      ['PUT', (id) => `/dm/players/${id}/abilities/KyarasInfluence`, undefined],
      ['DELETE', (id) => `/dm/players/${id}/abilities/ForcePush`, undefined],
      ['GET', (id) => `/dm/players/${id}/abilities/ForcePush/revoke-preview`, undefined],
      ['POST', (id) => `/dm/players/${id}/reset`, undefined],
    ];

    it.each(routes)('%s %s is a 404 for the other DM', async (method, path, body) => {
      const call = (id: number) => {
        const dm = as(b);
        switch (method) {
          case 'GET': return dm.get(path(id));
          case 'PUT': return dm.put(path(id));
          case 'DELETE': return dm.delete(path(id));
          case 'PATCH': return dm.patch(path(id), body);
          default: return dm.post(path(id), body);
        }
      };
      const foreign = await call(aPlayer.id);
      const missing = await call(99999);
      expect(foreign.status).toBe(404);
      // indistinguishable from a player that doesn't exist, so existence isn't revealed
      expect(foreign.status).toBe(missing.status);
      expect(foreign.body.error).toBe(missing.body.error);
      expect(String(foreign.body.message).replace(/\d+/, 'N')).toBe(String(missing.body.message).replace(/\d+/, 'N'));
    });

    it("none of that changed anything: the player, their login, vials and powers are intact", async () => {
      const mine = (await as(a).get('/dm/players').expect(200)).body.find((p: any) => p.id === aPlayer.id);
      expect(mine).toEqual({ id: aPlayer.id, username: 'a-one', vials: 4, claimed: [ROOT_KEY, 'ForcePush'] });
      await t.login('a-one', aPlayer.password).expect(200); // password not hijacked
      await t.login('stolen', 'hijacked-pw-1').expect(401);
    });

    it('cannot target another DM account, or itself', async () => {
      await as(b).patch(`/dm/players/${a.id}/vials`, { available: 5 }).expect(404);
      await as(b).delete(`/dm/players/${b.id}`).expect(404);
      await t.login('dm-a').expect(200); // still there
    });

    it('the owner can still do all of it', async () => {
      const preview = await as(a).get(`/dm/players/${aPlayer.id}/abilities/ForcePush/revoke-preview`).expect(200);
      expect(preview.body.owned).toBe(true);
      await as(a).put(`/dm/players/${aPlayer.id}/abilities/KyarasInfluence`).expect(200);
      await as(a).delete(`/dm/players/${aPlayer.id}/abilities/KyarasInfluence`).expect(200);
    });

    it("the DMs' players don't interfere with each other's data", async () => {
      await as(b).patch(`/dm/players/${bPlayer.id}/vials`, { available: 7 }).expect(200);
      const a1 = (await as(a).get('/dm/players').expect(200)).body.find((p: any) => p.id === aPlayer.id);
      expect(a1.vials).not.toBe(7);
    });
  });

  describe('players without an owner (e.g. left over from before ownership)', () => {
    it('are invisible to every DM and cannot be modified by any of them', async () => {
      const [orphan] = await t.db
        .insert(users)
        .values({ username: 'orphan', passwordHash: 'x', role: 'player' })
        .returning({ id: users.id });
      await t.db.insert(userAbilities).values({ userId: orphan.id, abilityKey: ROOT_KEY });
      for (const dm of [a, b]) {
        const list = (await as(dm).get('/dm/players').expect(200)).body;
        expect(list.some((p: any) => p.username === 'orphan')).toBe(false);
        await as(dm).patch(`/dm/players/${orphan.id}/vials`, { available: 5 }).expect(404);
        await as(dm).delete(`/dm/players/${orphan.id}`).expect(404);
      }
    });
  });

  it('players cannot use any DM route, whoever owns them', async () => {
    const token = await t.tokenFor('a-one', aPlayer.password);
    const auth = { Authorization: `Bearer ${token}` };
    await t.http().get('/dm/players').set(auth).expect(403);
    await t.http().patch(`/dm/players/${bPlayer.id}/vials`).set(auth).send({ available: 99 }).expect(403);
  });
});
