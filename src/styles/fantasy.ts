import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const fantasy: StyleGrammar = {
  id: "fantasy",
  name: "Fantasy",
  character: "Surreal, mythological. Impossible geometry, gravity-defying, dream logic.",

  proportions: {
    storyHeight: 5.0,
    bayWidth: 3.0,
    wallThickness: 0.05,
    roofHeightRatio: 0.6,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#d0c0e0",
    roof: "#6050a0",
    trim: "#8868c0",
    opening: "#181830",
    structure: "#b0a0d0",
    stroke: "#282040",
  },

  elements: {
    columns: ["column-corinthian", "column-ionic"],
    arches: ["arch-ogee", "arch-trefoil", "arch-pointed"],
    walls: ["wall-masonry"],
    buttresses: ["buttress-flying"],
  },

  roofForms: ["roof-spire", "roof-dome", "roof-gable"],
  windowTypes: ["window-rose", "window-lancet", "window-oculus"],
  doorTypes: ["door-portal", "door-arched"],
  decorativeElements: ["tracery", "cornice", "frieze"],
};

registerStyle(fantasy);
