import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const futuristic: StyleGrammar = {
  id: "futuristic",
  name: "Futuristic",
  character: "Sci-fi, weightless. Swooping curves, hovering volumes, glowing panels.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 6.0,
    wallThickness: 0.03,
    roofHeightRatio: 0.15,
    baseHeight: 2.0,
  },

  palette: {
    wall: "#e8e8f0",
    roof: "#c0c0d0",
    trim: "#4060a0",
    opening: "#607090",
    structure: "#d0d0e0",
    stroke: "#303048",
  },

  elements: {
    columns: ["column-simple"],
    arches: ["arch-parabolic"],
    walls: ["wall-glass"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-flat"],
  windowTypes: ["window-ribbon"],
  doorTypes: ["door-simple"],
  decorativeElements: ["glass-curtain-wall"],
};

registerStyle(futuristic);
