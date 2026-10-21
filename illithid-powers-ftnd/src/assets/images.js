import { mindData } from "./data";

// Images are bundled with the frontend; everything else about an ability comes
// from the API. Looked up by ability key (e.g. "ForcePush").
export const images = Object.fromEntries(
  Object.entries(mindData.abilities).map(([key, ability]) => [
    key,
    ability.imgPath,
  ])
);
