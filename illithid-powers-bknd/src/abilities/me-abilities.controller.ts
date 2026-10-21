import { Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { AbilitiesService } from "./abilities.service";

@Controller("me/abilities")
export class MeAbilitiesController {
  constructor(private readonly abilities: AbilitiesService) {}

  /** Keys of the abilities the caller has claimed. */
  @Get()
  claimed(@CurrentUser() user: AuthUser) {
    return this.abilities.claimedKeys(user.id);
  }

  /** Players only: the DM grants abilities through /dm routes instead. */
  @Roles("player")
  @Post(":key/claim")
  @HttpCode(200)
  claim(@CurrentUser() user: AuthUser, @Param("key") key: string) {
    return this.abilities.claim(user.id, key);
  }
}
