import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const gothic: StyleGrammar = {
  id: "gothic",
  name: "Gothic",
  character: "Tall, vertical emphasis. Pointed arches, flying buttresses, tracery, spires.",

  proportions: {
    storyHeight: 5.0,
    bayWidth: 2.5,
    wallThickness: 0.1,
    roofHeightRatio: 0.4,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#b8ada0",
    roof: "#6b6860",
    trim: "#a09888",
    opening: "#0a0a18",
    structure: "#9e9488",
    stroke: "#2a2420",
  },

  elements: {
    columns: ["column-simple", "pilaster"],
    arches: ["arch-pointed", "arch-lancet", "arch-trefoil", "arch-ogee"],
    walls: ["wall-masonry"],
    buttresses: ["buttress-flying", "buttress-stepped"],
  },

  roofForms: ["roof-spire", "roof-gable"],
  windowTypes: ["window-lancet", "window-rose", "window-arched"],
  doorTypes: ["door-portal", "door-arched"],
  decorativeElements: ["tracery", "cornice", "string-course"],
};

registerStyle(gothic);
