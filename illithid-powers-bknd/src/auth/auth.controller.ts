import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { GoogleLoginDto } from "./google-login.dto";
import { LoginDto } from "./login.dto";
import { Public } from "./public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Both sign-in routes are rate limited per IP address (see AuthModule), whether or
  // not the attempt succeeds, so passwords can't be guessed in bulk.
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  /** DMs sign in (and sign up) with the credential Google gave the browser. */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post("google")
  @HttpCode(200)
  google(@Body() dto: GoogleLoginDto) {
    return this.auth.googleLogin(dto.credential);
  }
}
