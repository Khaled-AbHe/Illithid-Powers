import { Module } from "@nestjs/common";
import { AbilitiesModule } from "../abilities/abilities.module";
import { DmController } from "./dm.controller";
import { PlayersService } from "./players.service";

@Module({
  imports: [AbilitiesModule],
  controllers: [DmController],
  providers: [PlayersService],
})
export class DmModule {}
