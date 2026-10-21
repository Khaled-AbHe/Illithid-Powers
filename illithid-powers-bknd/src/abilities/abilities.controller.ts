import { Controller, Get } from "@nestjs/common";
import { AbilitiesService } from "./abilities.service";

@Controller("abilities")
export class AbilitiesController {
  constructor(private readonly abilities: AbilitiesService) {}

  /** The ability catalog (any logged-in user). */
  @Get()
  catalog() {
    return this.abilities.catalog();
  }
}
