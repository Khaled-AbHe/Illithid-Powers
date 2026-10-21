import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { eq, isNotNull } from 'drizzle-orm';
import { users } from '../src/db/schema';
import { createTestApp, TestApp } from './helpers';

describe('Google sign-in (e2e, with the fake Google check)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
    await t.createUser({ username: 'legacy-gm', role: 'dm' }); // a password-based DM, as exists today
  });
  afterAll(() => t.close());

  const google = (sub: string, email: string, verified = true) =>
    t.http().post('/auth/google').send({ credential: `fake:${sub}:${email}:${verified}` });
  const googleRows = () => t.db.select().from(users).where(isNotNull(users.googleSub));
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('signing up and in', () => {
    it('creates a DM the first time, and the token works straight away', async () => {
      const res = await google('sub-1', 'first@example.com').expect(200);
      expect(res.body.user).toEqual({ id: expect.any(Number), username: 'first@example.com', role: 'dm' });
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|password_hash|googleSub|google_sub/);
      const me = await t.http().get('/me').set(bearer(res.body.accessToken)).expect(200);
      expect(me.body).toEqual({ id: res.body.user.id, username: 'first@example.com', role: 'dm', vials: 0 });
    });

    it('signs the same person in again to the same account, without creating another', async () => {
      const a = await google('sub-2', 'again@example.com').expect(200);
      const before = (await googleRows()).length;
      const b = await google('sub-2', 'again@example.com').expect(200);
      expect(b.body.user.id).toBe(a.body.user.id);
      expect((await googleRows()).length).toBe(before);
    });

    it('treats the email as case-insensitive, and keeps the account if the email later changes', async () => {
      const a = await google('sub-3', 'Mixed.Case@Example.COM').expect(200);
      expect(a.body.user.username).toBe('mixed.case@example.com');
      const upper = await google('sub-3', 'MIXED.CASE@EXAMPLE.COM').expect(200);
      expect(upper.body.user.id).toBe(a.body.user.id);
      const changed = await google('sub-3', 'moved-address@example.com').expect(200);
      expect(changed.body.user.id).toBe(a.body.user.id);
      expect(changed.body.user.username).toBe('mixed.case@example.com'); // stable, never rewritten
    });

    it('always makes a DM, whatever is sent along', async () => {
      const res = await t.http().post('/auth/google').send({ credential: 'fake:sub-4:role@example.com:true', role: 'player' }).expect(400);
      expect(res.body.message.join(' ')).toMatch(/role should not exist/);
      expect((await google('sub-4', 'role@example.com').expect(200)).body.user.role).toBe('dm');
    });

    it('survives many simultaneous first sign-ins: exactly one account', async () => {
      const results = await Promise.all(Array.from({ length: 6 }, () => google('sub-race', 'race@example.com')));
      expect(results.map((r) => r.status)).toEqual(Array(6).fill(200));
      expect(new Set(results.map((r) => r.body.user.id)).size).toBe(1);
      expect((await t.db.select().from(users).where(eq(users.googleSub, 'sub-race')))).toHaveLength(1);
    });
  });

  describe('what Google must prove', () => {
    it('rejects an email address Google has not verified, and creates nothing', async () => {
      const before = (await googleRows()).length;
      const res = await google('sub-unverified', 'unverified@example.com', false).expect(401);
      expect(res.body.message).toMatch(/not verified/);
      expect((await googleRows()).length).toBe(before);
    });

    it('rejects a credential the verifier does not accept', async () => {
      for (const credential of ['garbage', 'real-looking.jwt.token', 'fake:only-two', 'fake:s:e@example.com:maybe']) {
        const res = await t.http().post('/auth/google').send({ credential }).expect(401);
        expect(res.body.message).toBe('Google sign-in failed');
      }
    });

    it('validates the request body (400)', async () => {
      const post = (body: object) => t.http().post('/auth/google').send(body);
      await post({}).expect(400);
      await post({ credential: '' }).expect(400);
      await post({ credential: 123 }).expect(400);
      await post({ credential: 'x'.repeat(4097) }).expect(400);
      await post({ credential: 'fake:s:e@example.com:true', extra: 1 }).expect(400);
    });
  });

  describe('keeping accounts apart', () => {
    it('refuses a second Google account claiming an email that is already taken (409)', async () => {
      await google('sub-owner', 'taken@example.com').expect(200);
      const before = (await googleRows()).length;
      const res = await google('sub-impostor', 'taken@example.com').expect(409);
      expect(res.body.message).toMatch(/already used/);
      expect((await googleRows()).length).toBe(before);
    });

    it('cannot be used to take over an existing account by claiming its username as an "email"', async () => {
      await t.createUser({ username: 'someplayer', role: 'player' });
      await google('sub-grab', 'someplayer').expect(409);
      await google('sub-grab2', 'legacy-gm').expect(409);
      expect((await t.db.select().from(users).where(eq(users.username, 'someplayer')))[0].googleSub).toBeNull();
    });

    it('gives the account no usable password', async () => {
      const email = 'nopassword@example.com';
      await google('sub-nopw', email).expect(200);
      for (const password of ['password', 'nopassword@example.com', 'fake:sub-nopw:nopassword@example.com:true', ' ', 'x'.repeat(72)]) {
        await t.login(email, password).expect(401);
      }
    });

    it('leaves password sign-in for existing accounts alone', async () => {
      await t.login('legacy-gm').expect(200);
    });
  });

  describe('a Google DM using the app', () => {
    it('starts with no players, creates their own, and cannot see another Google DM’s', async () => {
      const a = (await google('sub-dm-a', 'dm-a@example.com').expect(200)).body.accessToken;
      const b = (await google('sub-dm-b', 'dm-b@example.com').expect(200)).body.accessToken;
      expect((await t.http().get('/dm/players').set(bearer(a)).expect(200)).body).toEqual([]);

      const created = await t.http().post('/dm/players').set(bearer(a)).send({ username: 'google-player', password: 'a-long-password' }).expect(201);
      const mine = (await t.http().get('/dm/players').set(bearer(a)).expect(200)).body;
      expect(mine.map((p: any) => p.username)).toEqual(['google-player']);
      expect((await t.http().get('/dm/players').set(bearer(b)).expect(200)).body).toEqual([]);
      await t.http().patch(`/dm/players/${created.body.id}/vials`).set(bearer(b)).send({ available: 9 }).expect(404);

      // and that player logs in with the password their DM gave them, as always
      await t.login('google-player', 'a-long-password').expect(200);
    });
  });
});
