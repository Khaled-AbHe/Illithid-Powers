import { INestApplication, Type } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { DRIZZLE } from '../src/db/db.constants';
import type { Db } from '../src/db/db.module';
import { abilities, userAbilities, users } from '../src/db/schema';

import { ROOT_KEY } from '../src/abilities/abilities.constants';
export { ROOT_KEY };

export interface TestApp {
  app: INestApplication;
  db: Db;
  jwt: JwtService;
  http: () => ReturnType<typeof request>;
  /** Mirrors what the seed script / DM "create player" do: user row + free root ability. */
  createUser(opts: {
    username: string;
    password?: string;
    role?: 'player' | 'dm';
    vials?: number;
    /** The DM that owns a player (ignored for DMs). */
    dmId?: number;
  }): Promise<number>;
  login(username: string, password?: string): request.Test;
  tokenFor(username: string, password?: string): Promise<string>;
  close(): Promise<void>;
}

/** Boots the real app on a throwaway SQLite file, migrated and loaded with the real ability catalog. */
export async function createTestApp(
  extraControllers: Type<unknown>[] = [],
  /** Per-test settings; `undefined` removes a setting. */
  env: Record<string, string | undefined> = {},
): Promise<TestApp> {
  const dir = mkdtempSync(join(tmpdir(), 'illithid-e2e-'));
  // Must be set before AppModule is loaded; process.env wins over any local .env.
  process.env.TURSO_DATABASE_URL = `file:${join(dir, 'test.db')}`;
  process.env.TURSO_AUTH_TOKEN = '';
  process.env.JWT_SECRET = 'e2e-test-secret';
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_ROUNDS = '4';
  // Defaults for every test: no practical rate limit, the fake Google check, no proxy.
  process.env.AUTH_RATE_LIMIT = '100000';
  process.env.AUTH_RATE_WINDOW_SECONDS = '60';
  process.env.GOOGLE_VERIFIER = 'fake';
  delete process.env.TRUST_PROXY;
  delete process.env.GOOGLE_CLIENT_ID;
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  const { AppModule } = await import('../src/app.module');
  const { configureApp } = await import('../src/app.setup');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: extraControllers,
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const db = app.get<Db>(DRIZZLE);
  await migrate(db, { migrationsFolder: join(__dirname, '../drizzle') });
  const catalog = JSON.parse(
    readFileSync(join(__dirname, '../src/db/abilities.seed.json'), 'utf8'),
  );
  await db.insert(abilities).values(catalog);

  const http = () => request(app.getHttpServer());
  const login = (username: string, password = `${username}-pw`) =>
    http().post('/auth/login').send({ username, password });

  return {
    app,
    db,
    jwt: app.get(JwtService),
    http,
    login,
    tokenFor: async (username, password) => (await login(username, password)).body.accessToken,
    async createUser({ username, password = `${username}-pw`, role = 'player', vials = 0, dmId }) {
      const [row] = await db
        .insert(users)
        .values({ username, passwordHash: bcrypt.hashSync(password, 4), role, vials, dmId: role === 'player' ? dmId : undefined })
        .returning({ id: users.id });
      if (role === 'player') {
        await db.insert(userAbilities).values({ userId: row.id, abilityKey: ROOT_KEY });
      }
      return row.id;
    },
    async close() {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
