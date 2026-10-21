import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule, JwtSignOptions } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { createGoogleVerifier, GoogleVerifier } from "./google/google.verifier";
import { JwtGuard } from "./jwt.guard";
import { RolesGuard } from "./roles.guard";

/** A positive whole number from an env var, or the fallback. */
const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

@Module({
  imports: [
    // Per-IP limit on the sign-in routes: AUTH_RATE_LIMIT attempts per
    // AUTH_RATE_WINDOW_SECONDS (default 20 per 60 seconds). Held in memory, so it
    // resets when the server restarts and isn't shared between several instances.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            limit: positiveInt(config.get<string>("AUTH_RATE_LIMIT"), 20),
            ttl: positiveInt(config.get<string>("AUTH_RATE_WINDOW_SECONDS"), 60) * 1000,
          },
        ],
        errorMessage: "Too many attempts. Please wait a minute and try again.",
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>("JWT_SECRET");
        if (
          config.get("NODE_ENV") === "production" &&
          (secret.length < 32 || secret === "change-me")
        ) {
          throw new Error("JWT_SECRET must be a random string of 32+ characters in production");
        }
        return {
          secret,
          signOptions: {
            algorithm: "HS256",
            expiresIn: (config.get<string>("JWT_EXPIRES_IN") ??
              "7d") as JwtSignOptions["expiresIn"],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: GoogleVerifier, inject: [ConfigService], useFactory: createGoogleVerifier },
    // Both guards apply to every route. Order matters: JwtGuard sets
    // request.user, then RolesGuard checks it.
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
