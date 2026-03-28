import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const vernacular: StyleGrammar = {
  id: "vernacular",
  name: "Vernacular / Rustic",
  character: "Practical, organic. Regional materials, climate adaptation, simple forms.",

  proportions: {
    storyHeight: 2.8,
    bayWidth: 2.5,
    wallThickness: 0.1,
    roofHeightRatio: 0.35,
    baseHeight: 0.3,
  },

  palette: {
    wall: "#c8b898",
    roof: "#7a6850",
    trim: "#a08868",
    opening: "#1a1818",
    structure: "#8a7858",
    stroke: "#3a3020",
  },

  elements: {
    columns: [],
    arches: [],
    walls: ["wall-masonry", "wall-timber-frame"],
    buttresses: [],
  },

  roofForms: ["roof-gable", "roof-hip"],
  windowTypes: ["window-single"],
  doorTypes: ["door-simple"],
  decorativeElements: [],
};

registerStyle(vernacular);
