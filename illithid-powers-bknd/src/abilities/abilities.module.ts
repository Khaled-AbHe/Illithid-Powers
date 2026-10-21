import { Module } from "@nestjs/common";
import { AbilitiesController } from "./abilities.controller";
import { AbilitiesService } from "./abilities.service";
import { MeAbilitiesController } from "./me-abilities.controller";

@Module({
  controllers: [AbilitiesController, MeAbilitiesController],
  providers: [AbilitiesService],
  exports: [AbilitiesService],
})
export class AbilitiesModule {}
