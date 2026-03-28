import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const deconstructivist: StyleGrammar = {
  id: "deconstructivist",
  name: "Deconstructivist",
  character: "Chaotic, angular. Fragmented forms, diagonal geometry, colliding volumes.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 5.0,
    wallThickness: 0.05,
    roofHeightRatio: 0.15,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#c8c4c0",
    roof: "#787478",
    trim: "#989498",
    opening: "#282830",
    structure: "#585458",
    stroke: "#282428",
  },

  elements: {
    columns: [],
    arches: [],
    walls: ["wall-glass", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-flat"],
  windowTypes: ["window-ribbon", "window-single"],
  doorTypes: ["door-simple"],
  decorativeElements: [],
};

registerStyle(deconstructivist);
