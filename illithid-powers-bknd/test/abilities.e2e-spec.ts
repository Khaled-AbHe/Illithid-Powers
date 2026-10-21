import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { userAbilities, users } from '../src/db/schema';
import { createTestApp, ROOT_KEY, TestApp } from './helpers';

describe('Abilities (e2e)', () => {
  let t: TestApp;
  let n = 0;

  beforeAll(async () => {
    t = await createTestApp();
    await t.createUser({ username: 'gm', role: 'dm' });
  });
  afterAll(() => t.close());

  /** A fresh player (own row, own token) so tests never share state. */
  async function player(vials: number) {
    const username = `p${++n}`;
    const id = await t.createUser({ username, vials });
    const token = await t.tokenFor(username);
    const auth = { Authorization: `Bearer ${token}` };
    return {
      id,
      token,
      claim: (key: string) => t.http().post(`/me/abilities/${key}/claim`).set(auth),
      vials: async () => (await t.http().get('/me').set(auth)).body.vials as number,
      claimed: async () => (await t.http().get('/me/abilities').set(auth)).body as string[],
    };
  }

  describe('GET /abilities', () => {
    it('requires a token', async () => {
      await t.http().get('/abilities').expect(401);
    });

    it('returns the full catalog with costs and any-of prerequisites', async () => {
      const p = await player(0);
      const res = await t.http().get('/abilities').set('Authorization', `Bearer ${p.token}`).expect(200);
      expect(res.body).toHaveLength(21);
      const byKey = Object.fromEntries(res.body.map((a: any) => [a.key, a]));
      expect(byKey[ROOT_KEY]).toMatchObject({ vialCost: 0, requires: [] });
      expect(byKey.KyarasInfluence).toMatchObject({ vialCost: 1, requires: [ROOT_KEY] });
      expect(byKey.ForceRepel).toMatchObject({ vialCost: 2, requires: ['ForcePush'] });
      expect(byKey.PsionicBacklash.requires.sort()).toEqual(['ForcePush', 'KyarasInfluence']);
      expect(byKey.BlackHole).toMatchObject({ vialCost: 3, requires: ['ForceRepel'] });
      expect(byKey.Enthrall).toEqual(
        expect.objectContaining({ key: 'Enthrall', name: 'Enthrall', description: expect.any(String) }),
      );
    });

    it('is also readable by the DM', async () => {
      const token = await t.tokenFor('gm');
      await t.http().get('/abilities').set('Authorization', `Bearer ${token}`).expect(200);
    });
  });

  describe('GET /me/abilities', () => {
    it('starts with just the free root ability', async () => {
      const p = await player(0);
      expect(await p.claimed()).toEqual([ROOT_KEY]);
    });

    it('only shows the caller\'s own claims', async () => {
      const a = await player(5);
      const b = await player(5);
      await a.claim('KyarasInfluence').expect(200);
      expect(await a.claimed()).toContain('KyarasInfluence');
      expect(await b.claimed()).toEqual([ROOT_KEY]);
    });

    it('is empty for the DM, who owns no abilities', async () => {
      const token = await t.tokenFor('gm');
      const res = await t.http().get('/me/abilities').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /me/abilities/:key/claim', () => {
    it('claims, charges the cost and persists both', async () => {
      const p = await player(5);
      const res = await p.claim('KyarasInfluence').expect(200);
      expect(res.body).toEqual({ key: 'KyarasInfluence', alreadyClaimed: false, charged: 1, vials: 4 });
      expect(await p.vials()).toBe(4);
      expect(await p.claimed()).toEqual([ROOT_KEY, 'KyarasInfluence']);
    });

    it('is idempotent: claiming again charges nothing', async () => {
      const p = await player(5);
      await p.claim('KyarasInfluence').expect(200);
      const again = await p.claim('KyarasInfluence').expect(200);
      expect(again.body).toEqual({ key: 'KyarasInfluence', alreadyClaimed: true, charged: 0, vials: 4 });
      expect(await p.vials()).toBe(4);
    });

    it('treats the root ability as already owned', async () => {
      const p = await player(2);
      const res = await p.claim(ROOT_KEY).expect(200);
      expect(res.body).toEqual({ key: ROOT_KEY, alreadyClaimed: true, charged: 0, vials: 2 });
    });

    it('returns 404 for an unknown ability', async () => {
      const p = await player(5);
      await p.claim('NotAnAbility').expect(404);
    });

    it('returns 403 MISSING_REQUIREMENTS and changes nothing', async () => {
      const p = await player(10);
      const res = await p.claim('ForceRepel').expect(403);
      expect(res.body).toMatchObject({ statusCode: 403, code: 'MISSING_REQUIREMENTS', requires: ['ForcePush'] });
      expect(await p.vials()).toBe(10);
      expect(await p.claimed()).toEqual([ROOT_KEY]);
    });

    it('accepts any one of several prerequisites (any-of)', async () => {
      // PsionicBacklash needs ForcePush OR KyarasInfluence.
      const viaKyara = await player(10);
      await viaKyara.claim('KyarasInfluence').expect(200);
      await viaKyara.claim('PsionicBacklash').expect(200);

      const viaForce = await player(10);
      await viaForce.claim('ForcePush').expect(200);
      await viaForce.claim('PsionicBacklash').expect(200);

      const neither = await player(10);
      await neither.claim('PsionicBacklash').expect(403);
    });

    it('returns 403 NOT_ENOUGH_VIALS with the shortfall, and rolls back fully', async () => {
      const p = await player(1);
      await p.claim('KyarasInfluence').expect(200); // spends the only vial
      // LuckOfTheFarRealms costs 2 and its prerequisite is met, but the balance is 0.
      const res = await p.claim('LuckOfTheFarRealms').expect(403);
      expect(res.body).toMatchObject({
        statusCode: 403,
        code: 'NOT_ENOUGH_VIALS',
        needed: 2,
        available: 0,
        shortfall: 2,
      });
      expect(await p.vials()).toBe(0);
      expect(await p.claimed()).toEqual([ROOT_KEY, 'KyarasInfluence']); // no leftover claim row
    });

    it('succeeds when the balance equals the cost exactly', async () => {
      const p = await player(1);
      const res = await p.claim('ForcePush').expect(200);
      expect(res.body.vials).toBe(0);
    });

    it('reports missing requirements before missing vials', async () => {
      const p = await player(0);
      const res = await p.claim('BlackHole').expect(403); // costs 3, needs ForceRepel, has neither
      expect(res.body.code).toBe('MISSING_REQUIREMENTS');
    });

    it('walks a whole branch and spends exactly the sum of the costs', async () => {
      const p = await player(6);
      await p.claim('ForcePush').expect(200); // 1
      await p.claim('ForceRepel').expect(200); // 2
      const last = await p.claim('BlackHole').expect(200); // 3
      expect(last.body.vials).toBe(0);
      expect(await p.claimed()).toEqual([ROOT_KEY, 'ForcePush', 'ForceRepel', 'BlackHole']);
    });

    it('forbids the DM from using the player claim route', async () => {
      const token = await t.tokenFor('gm');
      await t.http().post(`/me/abilities/${ROOT_KEY}/claim`).set('Authorization', `Bearer ${token}`).expect(403);
      const [gm] = await t.db.select().from(users).where(eq(users.username, 'gm'));
      const rows = await t.db.select().from(userAbilities).where(eq(userAbilities.userId, gm.id));
      expect(rows).toHaveLength(0);
    });

    it('requires a token', async () => {
      await t.http().post(`/me/abilities/${ROOT_KEY}/claim`).expect(401);
    });

    describe('concurrency', () => {
      it('never spends the same vials twice when claims race', async () => {
        const p = await player(1);
        // Two different 1-vial abilities, one vial: exactly one may win.
        const results = await Promise.all([p.claim('KyarasInfluence'), p.claim('PsionicOverload')]);
        const statuses = results.map((r) => r.status).sort();
        expect(statuses).toEqual([200, 403]);
        expect(await p.vials()).toBe(0);
        expect((await p.claimed()).length).toBe(2); // root + the single winner
      });

      it('charges only once when the same claim is fired repeatedly', async () => {
        const p = await player(3);
        const results = await Promise.all(Array.from({ length: 6 }, () => p.claim('KyarasInfluence')));
        expect(results.map((r) => r.status)).toEqual(Array(6).fill(200));
        expect(results.filter((r) => !r.body.alreadyClaimed)).toHaveLength(1);
        expect(await p.vials()).toBe(2);
        expect(await p.claimed()).toEqual([ROOT_KEY, 'KyarasInfluence']);
      });
    });
  });
});
