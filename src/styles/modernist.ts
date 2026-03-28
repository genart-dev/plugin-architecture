import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const modernist: StyleGrammar = {
  id: "modernist",
  name: "Modernist",
  character: "Minimal, horizontal. Flat roofs, curtain walls, pilotis, ribbon windows.",

  proportions: {
    storyHeight: 3.2,
    bayWidth: 4.0,
    wallThickness: 0.04,
    roofHeightRatio: 0.05,
    baseHeight: 0.3,
  },

  palette: {
    wall: "#f0ece4",
    roof: "#d8d4cc",
    trim: "#c8c0b4",
    opening: "#a8c8d8",
    structure: "#e0dcd4",
    stroke: "#404040",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-glass", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-flat"],
  windowTypes: ["window-ribbon", "window-single"],
  doorTypes: ["door-simple", "door-double"],
  decorativeElements: [],
};

registerStyle(modernist);
