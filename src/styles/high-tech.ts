import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const highTech: StyleGrammar = {
  id: "high-tech",
  name: "High-Tech",
  character: "Transparent, mechanical. Exposed structure and services, glass and steel.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 6.0,
    wallThickness: 0.03,
    roofHeightRatio: 0.1,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#d0dce4",
    roof: "#909498",
    trim: "#6080a0",
    opening: "#a0c8e0",
    structure: "#505860",
    stroke: "#303840",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-glass", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-flat", "roof-barrel-vault"],
  windowTypes: ["window-ribbon"],
  doorTypes: ["door-simple"],
  decorativeElements: [],
};

registerStyle(highTech);
