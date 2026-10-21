import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { AbilitiesService } from "../abilities/abilities.service";
import { AuthUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../auth/roles.decorator";
import { CreatePlayerDto, RenamePlayerDto, SetPasswordDto, SetVialsDto } from "./dto";
import { PlayersService } from "./players.service";

/**
 * Everything a DM can do to their own players. The class-level role applies to
 * every route, and every route is limited to the calling DM's players.
 */
@Roles("dm")
@Controller("dm/players")
export class DmController {
  constructor(
    private readonly players: PlayersService,
    private readonly abilities: AbilitiesService,
  ) {}

  @Get()
  list(@CurrentUser() dm: AuthUser) {
    return this.players.list(dm.id);
  }

  @Post()
  create(@CurrentUser() dm: AuthUser, @Body() dto: CreatePlayerDto) {
    return this.players.create(dm.id, dto.username, dto.password);
  }

  @Patch(":id")
  async rename(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RenamePlayerDto,
  ) {
    await this.players.requirePlayer(id, dm.id);
    return this.players.rename(id, dto.username);
  }

  /** Permanent. Players only; the DM account can't be deleted. */
  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() dm: AuthUser, @Param("id", ParseIntPipe) id: number) {
    await this.players.requirePlayer(id, dm.id);
    await this.players.remove(id);
  }

  @Patch(":id/password")
  @HttpCode(204)
  async setPassword(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetPasswordDto,
  ) {
    await this.players.requirePlayer(id, dm.id);
    await this.players.setPassword(id, dto.password);
  }

  @Patch(":id/vials")
  async setVials(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetVialsDto,
  ) {
    await this.players.requirePlayer(id, dm.id);
    return this.players.setVials(id, dto.available);
  }

  /** Grant on the player's behalf. Same rules as their own claim: needs a prerequisite and vials. */
  @Put(":id/abilities/:key")
  async grant(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Param("key") key: string,
  ) {
    await this.players.requirePlayer(id, dm.id);
    return this.abilities.claim(id, key);
  }

  /** Read-only: what a revoke would remove and refund. Changes nothing. */
  @Get(":id/abilities/:key/revoke-preview")
  async revokePreview(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Param("key") key: string,
  ) {
    await this.players.requirePlayer(id, dm.id);
    return this.abilities.previewRevoke(id, key);
  }

  /** Revoke with cascade; everything removed is refunded. */
  @Delete(":id/abilities/:key")
  async revoke(
    @CurrentUser() dm: AuthUser,
    @Param("id", ParseIntPipe) id: number,
    @Param("key") key: string,
  ) {
    await this.players.requirePlayer(id, dm.id);
    return this.abilities.revoke(id, key);
  }

  @Post(":id/reset")
  @HttpCode(200)
  async reset(@CurrentUser() dm: AuthUser, @Param("id", ParseIntPipe) id: number) {
    await this.players.requirePlayer(id, dm.id);
    return this.players.reset(id);
  }
}
