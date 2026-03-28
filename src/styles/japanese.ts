import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const japanese: StyleGrammar = {
  id: "japanese",
  name: "Japanese Traditional",
  character: "Low, open. Post-and-beam, curved eaves, engawa verandas, shoji screens.",

  proportions: {
    storyHeight: 2.8,
    bayWidth: 2.5,
    wallThickness: 0.04,
    roofHeightRatio: 0.5,
    baseHeight: 0.6,
  },

  palette: {
    wall: "#e8dcc0",
    roof: "#4a4438",
    trim: "#8a7058",
    opening: "#d0c8b0",
    structure: "#6a5840",
    stroke: "#2a2418",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-timber-frame"],
    buttresses: [],
  },

  roofForms: ["roof-hip", "roof-gable"],
  windowTypes: ["window-single", "window-paired"],
  doorTypes: ["door-simple"],
  decorativeElements: ["cornice"],
};

registerStyle(japanese);
