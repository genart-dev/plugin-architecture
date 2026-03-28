import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const classical: StyleGrammar = {
  id: "classical",
  name: "Classical / Greek",
  character: "Symmetrical, horizontal emphasis, stone. Columns + entablature + pediment.",

  proportions: {
    storyHeight: 4.0,
    bayWidth: 3.0,
    wallThickness: 0.08,
    roofHeightRatio: 0.25,
    baseHeight: 0.8,
  },

  palette: {
    wall: "#e8dcc8",
    roof: "#c4956a",
    trim: "#d4c4a8",
    opening: "#1a1a2e",
    structure: "#d8cbb0",
    stroke: "#3a3020",
  },

  elements: {
    columns: ["column-doric", "column-ionic", "column-corinthian"],
    arches: [],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-gable", "roof-hip"],
  windowTypes: ["window-single", "window-paired"],
  doorTypes: ["door-portal", "door-double"],
  decorativeElements: ["cornice", "frieze", "string-course", "quoins"],
};

registerStyle(classical);
