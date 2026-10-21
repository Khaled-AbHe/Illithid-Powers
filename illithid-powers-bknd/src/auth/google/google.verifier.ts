import { Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

/** What we take from a verified Google sign-in. */
export interface GoogleIdentity {
  /** Google's stable user id. The email can change; this never does. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

/** Turns the credential the browser got from Google into a verified identity, or throws. */
export abstract class GoogleVerifier {
  abstract verify(credential: string): Promise<GoogleIdentity>;
}

const FAILED = 'Google sign-in failed';

/**
 * Verifies a Google ID token with Google's own library: the signature against
 * Google's published keys, that it was issued by Google, that it hasn't
 * expired, and that it was issued for OUR client id (so a token Google issued
 * to some other app can't be used here).
 */
export class RealGoogleVerifier extends GoogleVerifier {
  private readonly log = new Logger('GoogleVerifier');

  constructor(
    private readonly clientId: string | undefined,
    private readonly client: Pick<OAuth2Client, 'verifyIdToken'> = new OAuth2Client(),
  ) {
    super();
  }

  async verify(credential: string): Promise<GoogleIdentity> {
    if (!this.clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured on this server');
    }
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken: credential, audience: this.clientId });
      payload = ticket.getPayload();
    } catch (err) {
      // Never log the credential itself, only why it was refused.
      this.log.warn(`Rejected a Google credential: ${(err as Error).message}`);
      throw new UnauthorizedException(FAILED);
    }
    if (!payload?.sub || !payload.email) throw new UnauthorizedException(FAILED);
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name,
    };
  }
}

/**
 * For automated tests only (see createGoogleVerifier): accepts credentials of
 * the form `fake:<sub>:<email>:<true|false>` so no real Google account is needed.
 */
export class FakeGoogleVerifier extends GoogleVerifier {
  async verify(credential: string): Promise<GoogleIdentity> {
    const [prefix, sub, email, verified] = credential.split(':');
    if (prefix !== 'fake' || !sub || !email || (verified !== 'true' && verified !== 'false')) {
      throw new UnauthorizedException(FAILED);
    }
    return { sub, email, emailVerified: verified === 'true' };
  }
}

/**
 * The fake is only ever used when NODE_ENV is "test" AND GOOGLE_VERIFIER is
 * "fake", so it can't be switched on in a real deployment by accident.
 */
export function createGoogleVerifier(env: { get(key: string): string | undefined }): GoogleVerifier {
  if (env.get('NODE_ENV') === 'test' && env.get('GOOGLE_VERIFIER') === 'fake') {
    return new FakeGoogleVerifier();
  }
  return new RealGoogleVerifier(env.get('GOOGLE_CLIENT_ID'));
}
