import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Controller, Get } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import request from 'supertest';

import { Roles } from '../src/auth/roles.decorator';
import type { Db } from '../src/db/db.module';
import { users } from '../src/db/schema';
import { createTestApp, TestApp } from './helpers';

// Test-only routes so RolesGuard can be exercised before the real /dm routes exist.
@Controller('test')
class TestController {
  @Get('any')
  any() {
    return { ok: true };
  }

  @Roles('dm')
  @Get('dm-only')
  dmOnly() {
    return { ok: true };
  }
}

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('Auth (e2e)', () => {
  let t: TestApp;
  let db: Db;
  let jwt: JwtService;
  let http: ReturnType<typeof request>;

  const login = (username: string, password: string) => t.login(username, password);
  const tokenFor = (username: string, pw: string) => t.tokenFor(username, pw);

  beforeAll(async () => {
    t = await createTestApp([TestController]);
    db = t.db;
    jwt = t.jwt;
    await t.createUser({ username: 'alice', role: 'player', vials: 3 });
    await t.createUser({ username: 'gm', role: 'dm' });
    http = t.http();
  });

  afterAll(() => t.close());

  describe('POST /auth/login', () => {
    it('returns a token and user for valid credentials', async () => {
      const res = await login('alice', 'alice-pw').expect(200);
      expect(res.body.user).toEqual({ id: expect.any(Number), username: 'alice', role: 'player' });
      const claims = jwt.decode(res.body.accessToken);
      expect(claims).toMatchObject({ username: 'alice', role: 'player', sub: String(res.body.user.id) });
      expect(claims.exp).toBeGreaterThan(claims.iat);
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('gives the DM a dm-role token', async () => {
      const res = await login('gm', 'gm-pw').expect(200);
      expect(res.body.user.role).toBe('dm');
      expect(jwt.decode(res.body.accessToken)).toMatchObject({ role: 'dm' });
    });

    it('rejects a wrong password and an unknown user with the same 401 message', async () => {
      const wrong = await login('alice', 'nope').expect(401);
      const unknown = await login('ghost', 'whatever').expect(401);
      expect(wrong.body.message).toBe('Invalid username or password');
      expect(unknown.body.message).toBe(wrong.body.message);
    });

    it('returns 400 for missing, empty, oversized or extra fields', async () => {
      await http.post('/auth/login').send({ username: 'alice' }).expect(400);
      await login('', 'x').expect(400);
      await login('alice', 'x'.repeat(73)).expect(400);
      await http.post('/auth/login').send({ username: 'alice', password: 'alice-pw', role: 'dm' }).expect(400);
    });
  });

  describe('JwtGuard', () => {
    it('keeps /health public', async () => {
      await http.get('/health').expect(200);
    });

    it('returns 401 without a token', async () => {
      await http.get('/me').expect(401);
      await http.get('/test/any').expect(401);
    });

    it('returns 401 for malformed tokens and wrong schemes', async () => {
      await http.get('/me').set('Authorization', 'Bearer not.a.jwt').expect(401);
      await http.get('/me').set('Authorization', 'Bearer').expect(401);
      const token = await tokenFor('alice', 'alice-pw');
      await http.get('/me').set('Authorization', `Basic ${token}`).expect(401);
    });

    it('returns 401 for a token signed with a different secret', async () => {
      const forged = await new JwtService({ secret: 'other' }).signAsync({ sub: '1', username: 'alice', role: 'player' });
      await http.get('/me').set('Authorization', `Bearer ${forged}`).expect(401);
    });

    it('returns 401 for an expired token', async () => {
      const [alice] = await db.select().from(users).where(eq(users.username, 'alice'));
      const expired = await jwt.signAsync({ sub: String(alice.id), username: 'alice', role: 'player' }, { expiresIn: -10 });
      await http.get('/me').set('Authorization', `Bearer ${expired}`).expect(401);
    });

    it('returns 401 for an unsigned "alg: none" token', async () => {
      const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: '2', username: 'gm', role: 'dm' })}.`;
      await http.get('/me').set('Authorization', `Bearer ${none}`).expect(401);
    });

    it('GET /me returns the caller (including vials) and never the hash', async () => {
      const token = await tokenFor('alice', 'alice-pw');
      const res = await http.get('/me').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body).toEqual({ id: expect.any(Number), username: 'alice', role: 'player', vials: 3 });
    });

    it('locks out a user who is deleted after logging in', async () => {
      await db.insert(users).values({ username: 'temp', passwordHash: bcrypt.hashSync('temp-pw', 4), role: 'player' });
      const token = await tokenFor('temp', 'temp-pw');
      await http.get('/me').set('Authorization', `Bearer ${token}`).expect(200);
      await db.delete(users).where(eq(users.username, 'temp'));
      await http.get('/me').set('Authorization', `Bearer ${token}`).expect(401);
    });
  });

  describe('RolesGuard', () => {
    it('lets any logged-in user through routes with no role restriction', async () => {
      const token = await tokenFor('alice', 'alice-pw');
      await http.get('/test/any').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('allows the DM and forbids players on a dm-only route', async () => {
      const dm = await tokenFor('gm', 'gm-pw');
      const player = await tokenFor('alice', 'alice-pw');
      await http.get('/test/dm-only').set('Authorization', `Bearer ${dm}`).expect(200);
      await http.get('/test/dm-only').set('Authorization', `Bearer ${player}`).expect(403);
      await http.get('/test/dm-only').expect(401);
    });

    it('uses the DB role, not the token claim, so a demoted DM loses access immediately', async () => {
      await db.insert(users).values({ username: 'exdm', passwordHash: bcrypt.hashSync('exdm-pw', 4), role: 'dm' });
      const token = await tokenFor('exdm', 'exdm-pw');
      expect(jwt.decode(token)).toMatchObject({ role: 'dm' });
      await http.get('/test/dm-only').set('Authorization', `Bearer ${token}`).expect(200);
      await db.update(users).set({ role: 'player' }).where(eq(users.username, 'exdm'));
      await http.get('/test/dm-only').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });
});
