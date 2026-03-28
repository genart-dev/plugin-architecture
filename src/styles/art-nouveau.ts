import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const artNouveau: StyleGrammar = {
  id: "art-nouveau",
  name: "Art Nouveau",
  character: "Flowing, asymmetric. Organic curves, iron and glass, whiplash ornament.",

  proportions: {
    storyHeight: 4.0,
    bayWidth: 3.0,
    wallThickness: 0.06,
    roofHeightRatio: 0.3,
    baseHeight: 0.6,
  },

  palette: {
    wall: "#e8e0d0",
    roof: "#607050",
    trim: "#8a7048",
    opening: "#1a2028",
    structure: "#706050",
    stroke: "#2a2820",
  },

  elements: {
    columns: ["column-simple", "pilaster"],
    arches: ["arch-ogee", "arch-parabolic"],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-mansard", "roof-dome", "roof-gable"],
  windowTypes: ["window-arched", "window-paired", "window-oculus"],
  doorTypes: ["door-arched", "door-double"],
  decorativeElements: ["cornice", "frieze", "string-course"],
};

registerStyle(artNouveau);
