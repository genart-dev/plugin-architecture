import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const renaissance: StyleGrammar = {
  id: "renaissance",
  name: "Renaissance",
  character: "Balanced, proportional. Classical revival with symmetry, rusticated base, ordered facades.",

  proportions: {
    storyHeight: 4.2,
    bayWidth: 3.2,
    wallThickness: 0.09,
    roofHeightRatio: 0.2,
    baseHeight: 1.2,
  },

  palette: {
    wall: "#e0d0b8",
    roof: "#a08868",
    trim: "#d0c0a0",
    opening: "#1a1a28",
    structure: "#d8c8a8",
    stroke: "#3a3020",
  },

  elements: {
    columns: ["column-ionic", "column-corinthian", "pilaster"],
    arches: ["arch-round"],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-hip", "roof-dome"],
  windowTypes: ["window-paired", "window-arched", "window-single"],
  doorTypes: ["door-portal", "door-double"],
  decorativeElements: ["cornice", "frieze", "rustication", "string-course", "quoins"],
};

registerStyle(renaissance);
