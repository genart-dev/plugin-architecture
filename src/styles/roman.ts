import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const roman: StyleGrammar = {
  id: "roman",
  name: "Roman",
  character: "Monumental, thick walls. Round arches, vaults, domes, heavy masonry.",

  proportions: {
    storyHeight: 4.5,
    bayWidth: 3.5,
    wallThickness: 0.12,
    roofHeightRatio: 0.3,
    baseHeight: 1.0,
  },

  palette: {
    wall: "#d8c8a8",
    roof: "#b8956a",
    trim: "#c8b898",
    opening: "#1a1820",
    structure: "#c8b898",
    stroke: "#3a3020",
  },

  elements: {
    columns: ["column-doric", "column-ionic", "column-corinthian"],
    arches: ["arch-round"],
    walls: ["wall-masonry"],
    buttresses: ["buttress-flat"],
  },

  roofForms: ["roof-dome", "roof-barrel-vault", "roof-gable"],
  windowTypes: ["window-arched", "window-single"],
  doorTypes: ["door-arched", "door-portal"],
  decorativeElements: ["cornice", "frieze", "rustication", "string-course"],
};

registerStyle(roman);
