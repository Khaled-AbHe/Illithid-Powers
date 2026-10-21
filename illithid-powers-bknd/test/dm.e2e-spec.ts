import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { userAbilities, users } from '../src/db/schema';
import { createTestApp, ROOT_KEY, TestApp } from './helpers';

describe('DM (e2e)', () => {
  let t: TestApp;
  let dm: { Authorization: string };
  let gmId: number;
  let n = 0;

  beforeAll(async () => {
    t = await createTestApp();
    gmId = await t.createUser({ username: 'gm', role: 'dm' });
    dm = { Authorization: `Bearer ${await t.tokenFor('gm')}` };
  });
  afterAll(() => t.close());

  /** A fresh player, plus handles for acting as them and as the DM on them. */
  async function player(vials = 0) {
    const username = `p${++n}`;
    const id = await t.createUser({ username, vials, dmId: gmId });
    const auth = { Authorization: `Bearer ${await t.tokenFor(username)}` };
    return {
      id,
      username,
      auth,
      claim: (key: string) => t.http().post(`/me/abilities/${key}/claim`).set(auth),
      me: async () => (await t.http().get('/me').set(auth)).body,
      claimed: async () => (await t.http().get('/me/abilities').set(auth)).body as string[],
      grant: (key: string) => t.http().put(`/dm/players/${id}/abilities/${key}`).set(dm),
      revoke: (key: string) => t.http().delete(`/dm/players/${id}/abilities/${key}`).set(dm),
      preview: (key: string) => t.http().get(`/dm/players/${id}/abilities/${key}/revoke-preview`).set(dm),
      setVials: (available: number) => t.http().patch(`/dm/players/${id}/vials`).set(dm).send({ available }),
    };
  }

  describe('access control', () => {
    it('rejects every DM route without a token (401) and for players (403)', async () => {
      const p = await player(0);
      const routes: [string, string][] = [
        ['get', '/dm/players'],
        ['post', '/dm/players'],
        ['patch', `/dm/players/${p.id}/password`],
        ['patch', `/dm/players/${p.id}/vials`],
        ['put', `/dm/players/${p.id}/abilities/ForcePush`],
        ['delete', `/dm/players/${p.id}/abilities/ForcePush`],
        ['get', `/dm/players/${p.id}/abilities/ForcePush/revoke-preview`],
        ['patch', `/dm/players/${p.id}`],
        ['delete', `/dm/players/${p.id}`],
        ['post', `/dm/players/${p.id}/reset`],
      ];
      for (const [method, url] of routes) {
        await (t.http() as any)[method](url).expect(401);
        await (t.http() as any)[method](url).set(p.auth).send({}).expect(403);
      }
    });

    it('treats the DM account and unknown ids as 404 targets, and bad ids as 400', async () => {
      const [gm] = await t.db.select().from(users).where(eq(users.username, 'gm'));
      await t.http().patch(`/dm/players/${gm.id}/vials`).set(dm).send({ available: 5 }).expect(404);
      await t.http().put(`/dm/players/${gm.id}/abilities/ForcePush`).set(dm).expect(404);
      await t.http().post('/dm/players/99999/reset').set(dm).expect(404);
      await t.http().post('/dm/players/abc/reset').set(dm).expect(400);
    });
  });

  describe('GET /dm/players', () => {
    it('lists players only, with balance and claimed keys in claim order', async () => {
      const p = await player(5);
      await p.claim('KyarasInfluence').expect(200);
      const res = await t.http().get('/dm/players').set(dm).expect(200);
      expect(res.body.map((x: any) => x.username)).not.toContain('gm');
      expect(res.body.find((x: any) => x.id === p.id)).toEqual({
        id: p.id,
        username: p.username,
        vials: 4,
        claimed: [ROOT_KEY, 'KyarasInfluence'],
      });
      for (const x of res.body) expect(x).not.toHaveProperty('passwordHash');
    });
  });

  describe('POST /dm/players', () => {
    it('creates a player with 0 vials and the root ability, who can then log in', async () => {
      const res = await t.http().post('/dm/players').set(dm)
        .send({ username: 'new.player', password: 'a-good-password' }).expect(201);
      expect(res.body).toEqual({ id: expect.any(Number), username: 'new.player', vials: 0, claimed: [ROOT_KEY] });
      expect(res.body).not.toHaveProperty('passwordHash');
      const login = await t.login('new.player', 'a-good-password').expect(200);
      expect(login.body.user.role).toBe('player');
      const token = login.body.accessToken;
      const mine = await t.http().get('/me/abilities').set('Authorization', `Bearer ${token}`).expect(200);
      expect(mine.body).toEqual([ROOT_KEY]);
    });

    it('rejects duplicates, including differing only by case, with 409', async () => {
      await t.http().post('/dm/players').set(dm).send({ username: 'Dupe', password: 'password-1' }).expect(201);
      await t.http().post('/dm/players').set(dm).send({ username: 'Dupe', password: 'password-1' }).expect(409);
      await t.http().post('/dm/players').set(dm).send({ username: 'dUPE', password: 'password-1' }).expect(409);
      await t.http().post('/dm/players').set(dm).send({ username: 'GM', password: 'password-1' }).expect(409);
    });

    it('validates input (400)', async () => {
      const bad = (body: object) => t.http().post('/dm/players').set(dm).send(body).expect(400);
      await bad({ username: 'ok-name', password: 'short' });
      await bad({ username: 'semi;colon', password: 'long-enough-pw' });
      await bad({ username: '', password: 'long-enough-pw' });
      await bad({ username: 'ok-name', password: 'x'.repeat(73) });
      await bad({ username: 'ok-name', password: 'long-enough-pw', role: 'dm' });
      await bad({ password: 'long-enough-pw' });
    });
  });

  describe('PATCH /dm/players/:id/password', () => {
    it('replaces the password: the old one stops working, the new one works', async () => {
      const p = await player();
      await t.http().patch(`/dm/players/${p.id}/password`).set(dm).send({ password: 'brand-new-pw' }).expect(204);
      await t.login(p.username, `${p.username}-pw`).expect(401);
      await t.login(p.username, 'brand-new-pw').expect(200);
    });

    it('validates the new password', async () => {
      const p = await player();
      await t.http().patch(`/dm/players/${p.id}/password`).set(dm).send({ password: 'short' }).expect(400);
      await t.http().patch(`/dm/players/${p.id}/password`).set(dm).send({}).expect(400);
      await t.login(p.username, `${p.username}-pw`).expect(200); // unchanged
    });
  });

  describe('PATCH /dm/players/:id/vials', () => {
    it('sets the balance directly and the player sees it', async () => {
      const p = await player(3);
      const res = await p.setVials(10).expect(200);
      expect(res.body).toEqual({ id: p.id, vials: 10 });
      expect((await p.me()).vials).toBe(10);
      await p.setVials(0).expect(200);
      expect((await p.me()).vials).toBe(0);
    });

    it('rejects negative, fractional, non-numeric, oversized and missing values', async () => {
      const p = await player(3);
      for (const body of [{ available: -1 }, { available: 1.5 }, { available: '5' }, { available: 1_000_001 }, {}]) {
        await t.http().patch(`/dm/players/${p.id}/vials`).set(dm).send(body).expect(400);
      }
      expect((await p.me()).vials).toBe(3);
    });

    it('is the only way to change a balance: players cannot', async () => {
      const p = await player(3);
      await t.http().patch(`/dm/players/${p.id}/vials`).set(p.auth).send({ available: 99 }).expect(403);
      await t.http().patch('/me').set(p.auth).send({ vials: 99 }).expect(404);
      expect((await p.me()).vials).toBe(3);
    });
  });

  describe('PUT /dm/players/:id/abilities/:key (grant)', () => {
    it("grants on the player's behalf when a prerequisite is owned, charging the vials", async () => {
      const p = await player(5);
      await p.claim('ForcePush').expect(200); // 5 -> 4
      const res = await p.grant('ForceRepel').expect(200); // needs ForcePush
      expect(res.body).toEqual({ key: 'ForceRepel', alreadyClaimed: false, charged: 2, vials: 2 });
      expect(await p.claimed()).toEqual([ROOT_KEY, 'ForcePush', 'ForceRepel']);
    });

    it('cannot bypass requirements: 403 MISSING_REQUIREMENTS and nothing changes', async () => {
      const p = await player(10);
      const res = await p.grant('BlackHole').expect(403); // needs ForceRepel, which p doesn't own
      expect(res.body).toMatchObject({ code: 'MISSING_REQUIREMENTS', requires: ['ForceRepel'] });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
      expect((await p.me()).vials).toBe(10);
    });

    it('accepts any one of several prerequisites (any-of), and refuses when none is owned', async () => {
      // PsionicBacklash needs ForcePush OR KyarasInfluence.
      const viaKyara = await player(10);
      await viaKyara.claim('KyarasInfluence').expect(200);
      await viaKyara.grant('PsionicBacklash').expect(200);

      const neither = await player(10);
      await neither.grant('PsionicBacklash').expect(403);
    });

    it('reports missing requirements before missing vials', async () => {
      const p = await player(0);
      const res = await p.grant('BlackHole').expect(403); // costs 3, needs ForceRepel, has neither
      expect(res.body.code).toBe('MISSING_REQUIREMENTS');
    });

    it('returns 403 NOT_ENOUGH_VIALS and grants nothing when the balance is too low', async () => {
      const p = await player(1);
      await p.claim('ForcePush').expect(200); // spends the only vial
      const res = await p.grant('ForceRepel').expect(403); // prerequisite met, balance 0
      expect(res.body).toMatchObject({ code: 'NOT_ENOUGH_VIALS', needed: 2, available: 0, shortfall: 2 });
      expect(await p.claimed()).toEqual([ROOT_KEY, 'ForcePush']);
      expect((await p.me()).vials).toBe(0);
    });

    it('is idempotent and 404s on unknown keys', async () => {
      const p = await player(5);
      await p.grant('ForcePush').expect(200);
      const again = await p.grant('ForcePush').expect(200);
      expect(again.body).toMatchObject({ alreadyClaimed: true, charged: 0, vials: 4 });
      await p.grant('Nope').expect(404);
    });

    it("follows exactly the same rules as the player's own claim, for every ability", async () => {
      const catalog = (await t.http().get('/abilities').set(dm).expect(200)).body as { key: string }[];
      const byClaim = await player(100);
      const byGrant = await player(100);
      // Same sequence for both, so their states stay in step as claims succeed.
      for (const { key } of catalog) {
        const claimed = await byClaim.claim(key);
        const granted = await byGrant.grant(key);
        expect([key, granted.status, granted.body.code]).toEqual([key, claimed.status, claimed.body.code]);
      }
      expect(await byGrant.claimed()).toEqual(await byClaim.claimed());
      expect((await byGrant.me()).vials).toBe((await byClaim.me()).vials);
    });
  });

  describe('DELETE /dm/players/:id/abilities/:key (revoke)', () => {
    it('removes one ability and refunds its cost', async () => {
      const p = await player(5);
      await p.claim('ForcePush').expect(200); // 5 -> 4
      const res = await p.revoke('ForcePush').expect(200);
      expect(res.body).toEqual({ removed: ['ForcePush'], refunded: 1, vials: 5 });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
      expect((await p.me()).vials).toBe(5);
    });

    it('cascades through dependents and refunds all of it', async () => {
      const p = await player(6);
      await p.claim('ForcePush').expect(200); // 1
      await p.claim('ForceRepel').expect(200); // 2
      await p.claim('BlackHole').expect(200); // 3
      expect((await p.me()).vials).toBe(0);

      const res = await p.revoke('ForcePush').expect(200);
      expect(res.body).toEqual({ removed: ['ForcePush', 'ForceRepel', 'BlackHole'], refunded: 6, vials: 6 });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
      expect((await p.me()).vials).toBe(6);
    });

    it('revoking mid-chain keeps what is above it', async () => {
      const p = await player(6);
      for (const k of ['ForcePush', 'ForceRepel', 'BlackHole']) await p.claim(k).expect(200);
      const res = await p.revoke('ForceRepel').expect(200);
      expect(res.body).toMatchObject({ removed: ['ForceRepel', 'BlackHole'], refunded: 5, vials: 5 });
      expect(await p.claimed()).toEqual([ROOT_KEY, 'ForcePush']);
    });

    it('keeps an ability that still has another prerequisite (any-of), then removes it with the last', async () => {
      const p = await player(10);
      for (const k of ['ForcePush', 'KyarasInfluence', 'PsionicBacklash']) await p.claim(k).expect(200); // 1+1+2
      const first = await p.revoke('ForcePush').expect(200);
      expect(first.body).toMatchObject({ removed: ['ForcePush'], refunded: 1 });
      expect(await p.claimed()).toContain('PsionicBacklash');
      const second = await p.revoke('KyarasInfluence').expect(200);
      expect(second.body).toMatchObject({ removed: ['KyarasInfluence', 'PsionicBacklash'], refunded: 3 });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
      expect((await p.me()).vials).toBe(10); // everything refunded
    });

    it('refunds on top of whatever the balance is now (not back to the old balance)', async () => {
      const p = await player(3);
      await p.claim('ForcePush').expect(200); // 3 -> 2
      await p.setVials(10).expect(200);
      const res = await p.revoke('ForcePush').expect(200);
      expect(res.body.vials).toBe(11);
    });

    it('does not sweep up an unrelated ability that was already unsupported (legacy data)', async () => {
      const p = await player(10);
      // The API no longer allows this state; it can only exist from before that rule, so insert it directly.
      await t.db.insert(userAbilities).values({ userId: p.id, abilityKey: 'BlackHole' }); // needs ForceRepel
      await p.claim('ForcePush').expect(200);
      const res = await p.revoke('ForcePush').expect(200);
      expect(res.body.removed).toEqual(['ForcePush']);
      expect(await p.claimed()).toEqual([ROOT_KEY, 'BlackHole']);
    });

    it('cannot revoke the root, 404s unknown keys, and is a no-op for unowned ones', async () => {
      const p = await player(3);
      await p.revoke(ROOT_KEY).expect(400);
      await p.revoke('Nope').expect(404);
      const res = await p.revoke('ForcePush').expect(200); // exists, not owned
      expect(res.body).toEqual({ removed: [], refunded: 0, vials: 3 });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
    });

    it('lets the player claim again afterwards', async () => {
      const p = await player(1);
      await p.claim('ForcePush').expect(200);
      await p.revoke('ForcePush').expect(200);
      await p.claim('ForcePush').expect(200);
      expect((await p.me()).vials).toBe(0);
    });

    it('only touches the targeted player', async () => {
      const a = await player(5);
      const b = await player(5);
      await a.claim('ForcePush').expect(200);
      await b.claim('ForcePush').expect(200);
      await a.revoke('ForcePush').expect(200);
      expect(await b.claimed()).toEqual([ROOT_KEY, 'ForcePush']);
      expect((await b.me()).vials).toBe(4);
    });
  });

  describe('GET /dm/players/:id/abilities/:key/revoke-preview', () => {
    it('shows what a cascade would remove and refund, with names and costs', async () => {
      const p = await player(6);
      for (const k of ['ForcePush', 'ForceRepel', 'BlackHole']) await p.claim(k).expect(200);
      const res = await p.preview('ForcePush').expect(200);
      expect(res.body).toEqual({
        key: 'ForcePush',
        owned: true,
        removed: [
          { key: 'ForcePush', name: 'Force Push', vialCost: 1 },
          { key: 'ForceRepel', name: 'Force Repel', vialCost: 2 },
          { key: 'BlackHole', name: 'Black Hole', vialCost: 3 },
        ],
        refund: 6,
        vials: 0,
        vialsAfter: 6,
        kept: [],
      });
    });

    it('changes nothing', async () => {
      const p = await player(6);
      for (const k of ['ForcePush', 'ForceRepel']) await p.claim(k).expect(200);
      const before = { claimed: await p.claimed(), vials: (await p.me()).vials };
      await p.preview('ForcePush').expect(200);
      await p.preview('ForcePush').expect(200);
      expect({ claimed: await p.claimed(), vials: (await p.me()).vials }).toEqual(before);
    });

    it('names what is spared and why (any-of)', async () => {
      const p = await player(10);
      for (const k of ['ForcePush', 'KyarasInfluence', 'PsionicBacklash']) await p.claim(k).expect(200);
      const res = await p.preview('ForcePush').expect(200);
      expect(res.body.removed.map((r: any) => r.key)).toEqual(['ForcePush']);
      expect(res.body.refund).toBe(1);
      expect(res.body.kept).toEqual([
        {
          key: 'PsionicBacklash',
          name: 'Psionic Backlash',
          via: [{ key: 'KyarasInfluence', name: "Kyara's Influence" }],
        },
      ]);
    });

    it('drops the spared ability once its last prerequisite is the one being removed', async () => {
      const p = await player(10);
      for (const k of ['ForcePush', 'KyarasInfluence', 'PsionicBacklash']) await p.claim(k).expect(200);
      await p.revoke('ForcePush').expect(200);
      const res = await p.preview('KyarasInfluence').expect(200);
      expect(res.body.removed.map((r: any) => r.key)).toEqual(['KyarasInfluence', 'PsionicBacklash']);
      expect(res.body.kept).toEqual([]);
    });

    it('reports an unowned ability as owned:false with nothing to remove', async () => {
      const p = await player(3);
      const res = await p.preview('ForcePush').expect(200);
      expect(res.body).toMatchObject({ owned: false, removed: [], refund: 0, vials: 3, vialsAfter: 3, kept: [] });
    });

    it('rejects the root (400), unknown keys (404), unknown players and the DM (404)', async () => {
      const p = await player(3);
      await p.preview(ROOT_KEY).expect(400);
      await p.preview('Nope').expect(404);
      await t.http().get('/dm/players/99999/abilities/ForcePush/revoke-preview').set(dm).expect(404);
      const [gm] = await t.db.select().from(users).where(eq(users.username, 'gm'));
      await t.http().get(`/dm/players/${gm.id}/abilities/ForcePush/revoke-preview`).set(dm).expect(404);
    });

    it('does not count an unrelated, already-unsupported ability (legacy data) as removed', async () => {
      const p = await player(10);
      await t.db.insert(userAbilities).values({ userId: p.id, abilityKey: 'BlackHole' }); // needs ForceRepel, never owned
      await p.claim('ForcePush').expect(200);
      const res = await p.preview('ForcePush').expect(200);
      expect(res.body.removed.map((r: any) => r.key)).toEqual(['ForcePush']);
    });

    describe('always agrees with the real revoke', () => {
      const scenarios: [string, string[], string][] = [
        ['a whole chain', ['ForcePush', 'ForceRepel', 'BlackHole'], 'ForcePush'],
        ['mid-chain', ['ForcePush', 'ForceRepel', 'BlackHole'], 'ForceRepel'],
        ['a leaf', ['ForcePush', 'ForceRepel', 'BlackHole'], 'BlackHole'],
        ['any-of survivor', ['ForcePush', 'KyarasInfluence', 'PsionicBacklash'], 'ForcePush'],
        ['any-of last prerequisite', ['KyarasInfluence', 'PsionicBacklash'], 'KyarasInfluence'],
        ['a diamond', ['ForcePush', 'MentalRejuvenation', 'DefensiveSwap', 'PsionicEscape'], 'ForcePush'],
        ['a diamond, other side', ['ForcePush', 'MentalRejuvenation', 'DefensiveSwap', 'PsionicEscape'], 'MentalRejuvenation'],
      ];
      it.each(scenarios)('%s', async (_name, claims, target) => {
        const p = await player(30);
        for (const k of claims) await p.claim(k).expect(200);
        const previewed = (await p.preview(target).expect(200)).body;
        const actual = (await p.revoke(target).expect(200)).body;
        expect(previewed.removed.map((r: any) => r.key)).toEqual(actual.removed);
        expect(previewed.refund).toBe(actual.refunded);
        expect(previewed.vialsAfter).toBe(actual.vials);
        // and the survivors it promised really survived
        const left = await p.claimed();
        for (const k of previewed.kept) expect(left).toContain(k.key);
      });
    });
  });

  describe('PATCH /dm/players/:id (rename)', () => {
    const rename = (id: number, username: unknown) =>
      t.http().patch(`/dm/players/${id}`).set(dm).send({ username });

    it('renames: the new name logs in, the old one does not, and everything else is untouched', async () => {
      const p = await player(5);
      await p.claim('ForcePush').expect(200);
      const res = await rename(p.id, `${p.username}-renamed`).expect(200);
      expect(res.body).toEqual({ id: p.id, username: `${p.username}-renamed` });

      await t.login(`${p.username}-renamed`, `${p.username}-pw`).expect(200);
      await t.login(p.username, `${p.username}-pw`).expect(401);
      const listed = (await t.http().get('/dm/players').set(dm).expect(200)).body.find((x: any) => x.id === p.id);
      expect(listed).toEqual({ id: p.id, username: `${p.username}-renamed`, vials: 4, claimed: [ROOT_KEY, 'ForcePush'] });
    });

    it('does not sign the player out: their existing token still works and shows the new name', async () => {
      const p = await player(1);
      await rename(p.id, `${p.username}-r2`).expect(200);
      const me = await t.http().get('/me').set(p.auth).expect(200);
      expect(me.body).toMatchObject({ id: p.id, username: `${p.username}-r2` });
    });

    it('allows changing only the capitals of their own name, and renaming to the same name', async () => {
      const p = await player(0);
      const upper = p.username.toUpperCase();
      await rename(p.id, upper).expect(200);
      await rename(p.id, upper).expect(200);
      await t.login(upper, `${p.username}-pw`).expect(200);
    });

    it("returns 409 when another account has the name, ignoring capitals, including the DM's", async () => {
      const a = await player(0);
      const b = await player(0);
      await rename(a.id, b.username).expect(409);
      await rename(a.id, b.username.toUpperCase()).expect(409);
      await rename(a.id, 'gm').expect(409);
      await rename(a.id, 'GM').expect(409);
      await t.login(a.username, `${a.username}-pw`).expect(200); // unchanged
    });

    it('validates the name (400)', async () => {
      const p = await player(0);
      for (const bad of ['', '   ', 'x'.repeat(65), 'semi;colon', 'a\tb', 'a😀', '\u0308', "-.'", 5, null, undefined]) {
        await rename(p.id, bad).expect(400);
      }
      await t.http().patch(`/dm/players/${p.id}`).set(dm).send({ username: 'ok-name', role: 'dm' }).expect(400);
      await t.login(p.username, `${p.username}-pw`).expect(200); // unchanged
    });

    it('404s for unknown players and the DM account, 400 for a bad id', async () => {
      const [gm] = await t.db.select().from(users).where(eq(users.username, 'gm'));
      await rename(99999, 'someone').expect(404);
      await rename(gm.id, 'someone').expect(404);
      await t.http().patch('/dm/players/abc').set(dm).send({ username: 'someone' }).expect(400);
    });
  });

  describe('DELETE /dm/players/:id', () => {
    const remove = (id: number) => t.http().delete(`/dm/players/${id}`).set(dm);

    it('deletes the account and their claimed powers, and locks them out immediately', async () => {
      const p = await player(6);
      for (const k of ['ForcePush', 'ForceRepel']) await p.claim(k).expect(200);
      await t.http().get('/me').set(p.auth).expect(200);

      await remove(p.id).expect(204);

      const list = (await t.http().get('/dm/players').set(dm).expect(200)).body;
      expect(list.some((x: any) => x.id === p.id)).toBe(false);
      expect(await t.db.select().from(userAbilities).where(eq(userAbilities.userId, p.id))).toHaveLength(0);
      expect(await t.db.select().from(users).where(eq(users.id, p.id))).toHaveLength(0);
      await t.login(p.username, `${p.username}-pw`).expect(401);
      await t.http().get('/me').set(p.auth).expect(401); // the token they already had
    });

    it('leaves every other player exactly as they were', async () => {
      const a = await player(6);
      const b = await player(6);
      await a.claim('ForcePush').expect(200);
      await b.claim('ForcePush').expect(200);
      await remove(a.id).expect(204);
      expect(await b.claimed()).toEqual([ROOT_KEY, 'ForcePush']);
      expect((await b.me()).vials).toBe(5);
    });

    it('returns 404 when the player is already gone, and for unknown ids', async () => {
      const p = await player(0);
      await remove(p.id).expect(204);
      await remove(p.id).expect(404);
      await remove(99999).expect(404);
    });

    it('cannot delete the DM account, which still works afterwards', async () => {
      const [gm] = await t.db.select().from(users).where(eq(users.username, 'gm'));
      await remove(gm.id).expect(404);
      await t.login('gm').expect(200);
      expect(await t.db.select().from(users).where(eq(users.id, gm.id))).toHaveLength(1);
    });

    it('rejects a bad id (400)', async () => {
      await t.http().delete('/dm/players/abc').set(dm).expect(400);
    });

    it('lets the name be reused, and the old token never works for the new account', async () => {
      const p = await player(0);
      await remove(p.id).expect(204);
      const created = await t.http().post('/dm/players').set(dm).send({ username: p.username, password: 'a-new-password' }).expect(201);
      expect(created.body.id).not.toBe(p.id); // ids are never reused
      await t.http().get('/me').set(p.auth).expect(401);
      await t.login(p.username, 'a-new-password').expect(200);
    });
  });

  describe('player names: spaces, accents and apostrophes', () => {
    const tag = Date.now();
    const create = (username: unknown) =>
      t.http().post('/dm/players').set(dm).send({ username, password: 'long-enough-pw' });

    it('accepts them, and the player can log in with exactly that name', async () => {
      for (const name of [`Zoë ${tag}`, `O'Brien ${tag}`, `Mary-Jane Smith ${tag}`, `Мария ${tag}`]) {
        const res = await create(name).expect(201);
        expect(res.body.username).toBe(name);
        await t.login(name, 'long-enough-pw').expect(200);
      }
    });

    it('stores one canonical form, and logging in works however the name is typed', async () => {
      const res = await create(`  Sir   Elk\u2019s ${tag} `).expect(201); // curly apostrophe, extra spaces
      expect(res.body.username).toBe(`Sir Elk's ${tag}`);
      await t.login(`Sir Elk\u2019s ${tag}`, 'long-enough-pw').expect(200);
      await t.login(`  Sir Elk's ${tag}  `, 'long-enough-pw').expect(200);

      const decomposed = await create(`Noe\u0308l ${tag}`).expect(201); // e + combining accent
      expect(decomposed.body.username).toBe(`Noël ${tag}`);
      await t.login(`Noe\u0308l ${tag}`, 'long-enough-pw').expect(200);
    });

    it('treats names that differ only by capitals, accents typing or spacing as the same name (409)', async () => {
      await create(`Zoë Taken ${tag}`).expect(201);
      await create(`ZOË TAKEN ${tag}`).expect(409); // SQLite lower() would call these different
      await create(`zoë taken ${tag}`).expect(409);
      await create(`Zoe\u0308 Taken ${tag}`).expect(409);
      await create(`Zoë   Taken ${tag}`).expect(409);
      await create(`O'Brien Taken ${tag}`).expect(201);
      await create(`O\u2019BRIEN Taken ${tag}`).expect(409);
    });

    it('applies to renames too, and allows changing only the capitals of an accented name', async () => {
      const p = await player(0);
      await t.http().patch(`/dm/players/${p.id}`).set(dm).send({ username: `Zoë Ren ${tag}` }).expect(200);
      const upper = await t.http().patch(`/dm/players/${p.id}`).set(dm).send({ username: `ZOË REN ${tag}` }).expect(200);
      expect(upper.body.username).toBe(`ZOË REN ${tag}`);
      const other = await player(0);
      await t.http().patch(`/dm/players/${other.id}`).set(dm).send({ username: `zoë ren ${tag}` }).expect(409);
    });

    it('still rejects control characters, emoji, invisible characters and names with no letter or number', async () => {
      for (const bad of ['a\tb', 'a\nb', 'a😀', 'a\u200bb', '\u0308', "-.'", '   ', 'x'.repeat(65)]) {
        await create(bad).expect(400);
      }
    });
  });

  describe('POST /dm/players/:id/reset', () => {
    it('clears everything except the root and zeroes the balance', async () => {
      const p = await player(6);
      await p.claim('ForcePush').expect(200);
      await p.claim('ForceRepel').expect(200);
      const res = await t.http().post(`/dm/players/${p.id}/reset`).set(dm).expect(200);
      expect(res.body).toEqual({ removed: ['ForcePush', 'ForceRepel'], vials: 0 });
      expect(await p.claimed()).toEqual([ROOT_KEY]);
      expect((await p.me()).vials).toBe(0);
    });

    it('also works on a fresh player and leaves other players alone', async () => {
      const a = await player(2);
      const b = await player(4);
      await b.claim('ForcePush').expect(200);
      const res = await t.http().post(`/dm/players/${a.id}/reset`).set(dm).expect(200);
      expect(res.body).toEqual({ removed: [], vials: 0 });
      expect(await b.claimed()).toEqual([ROOT_KEY, 'ForcePush']);
      expect((await b.me()).vials).toBe(3);
    });
  });
});
