import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const georgian: StyleGrammar = {
  id: "georgian",
  name: "Georgian / Colonial",
  character: "Restrained symmetry. Sash windows, classical doorcase, balanced proportions.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 2.8,
    wallThickness: 0.07,
    roofHeightRatio: 0.25,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#d8c8b0",
    roof: "#5a5048",
    trim: "#f0e8d8",
    opening: "#1a1a28",
    structure: "#c8b898",
    stroke: "#3a3028",
  },

  elements: {
    columns: ["pilaster"],
    arches: [],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-hip", "roof-gable"],
  windowTypes: ["window-single", "window-paired"],
  doorTypes: ["door-portal", "door-double"],
  decorativeElements: ["cornice", "quoins", "string-course"],
};

registerStyle(georgian);
