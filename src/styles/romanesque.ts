import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const romanesque: StyleGrammar = {
  id: "romanesque",
  name: "Romanesque",
  character: "Squat, fortress-like. Round arches, thick walls, small windows, heavy masonry.",

  proportions: {
    storyHeight: 4.0,
    bayWidth: 3.0,
    wallThickness: 0.15,
    roofHeightRatio: 0.25,
    baseHeight: 0.6,
  },

  palette: {
    wall: "#b0a090",
    roof: "#7a7060",
    trim: "#a09080",
    opening: "#0a0a15",
    structure: "#a09888",
    stroke: "#2a2018",
  },

  elements: {
    columns: ["column-simple", "pilaster"],
    arches: ["arch-round"],
    walls: ["wall-masonry"],
    buttresses: ["buttress-flat", "buttress-stepped"],
  },

  roofForms: ["roof-barrel-vault", "roof-gable"],
  windowTypes: ["window-arched", "window-single"],
  doorTypes: ["door-arched", "door-portal"],
  decorativeElements: ["cornice", "string-course"],
};

registerStyle(romanesque);
