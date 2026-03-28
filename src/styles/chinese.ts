import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const chinese: StyleGrammar = {
  id: "chinese",
  name: "Chinese Traditional",
  character: "Horizontal, platform-raised. Dougong brackets, curved eaves, hip-and-gable roofs.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 3.5,
    wallThickness: 0.06,
    roofHeightRatio: 0.5,
    baseHeight: 1.2,
  },

  palette: {
    wall: "#c8a878",
    roof: "#3a3830",
    trim: "#a02020",
    opening: "#1a1818",
    structure: "#6a2020",
    stroke: "#1a1810",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-hip", "roof-gable"],
  windowTypes: ["window-single", "window-paired"],
  doorTypes: ["door-double", "door-simple"],
  decorativeElements: ["cornice", "frieze"],
};

registerStyle(chinese);
