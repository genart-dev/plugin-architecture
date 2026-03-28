import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const artDeco: StyleGrammar = {
  id: "art-deco",
  name: "Art Deco",
  character: "Angular, streamlined. Stepped massing, geometric ornament, vertical emphasis.",

  proportions: {
    storyHeight: 3.8,
    bayWidth: 3.5,
    wallThickness: 0.06,
    roofHeightRatio: 0.15,
    baseHeight: 1.0,
  },

  palette: {
    wall: "#e0d8c8",
    roof: "#706858",
    trim: "#c8a048",
    opening: "#1a1a28",
    structure: "#b0a890",
    stroke: "#2a2820",
  },

  elements: {
    columns: ["pilaster"],
    arches: [],
    walls: ["wall-masonry", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-flat", "roof-spire"],
  windowTypes: ["window-single", "window-ribbon", "window-arched"],
  doorTypes: ["door-double", "door-portal"],
  decorativeElements: ["cornice", "frieze", "string-course"],
};

registerStyle(artDeco);
