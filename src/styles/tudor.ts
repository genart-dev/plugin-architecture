import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const tudor: StyleGrammar = {
  id: "tudor",
  name: "Tudor / Half-Timber",
  character: "Exposed timber frame, steep gables, mullioned windows. Asymmetric.",

  proportions: {
    storyHeight: 3.0,
    bayWidth: 2.5,
    wallThickness: 0.07,
    roofHeightRatio: 0.45,
    baseHeight: 0.3,
  },

  palette: {
    wall: "#f0e6d0",
    roof: "#5a4a3a",
    trim: "#5c3a1e",
    opening: "#1a1a2e",
    structure: "#5c3a1e",
    stroke: "#2a1a0a",
  },

  elements: {
    columns: [],
    arches: [],
    walls: ["wall-timber-frame", "wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-gable", "roof-hip"],
  windowTypes: ["window-paired", "window-single", "window-dormer"],
  doorTypes: ["door-arched", "door-simple"],
  decorativeElements: ["timber-framing", "string-course"],
};

registerStyle(tudor);
