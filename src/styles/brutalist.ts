import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const brutalist: StyleGrammar = {
  id: "brutalist",
  name: "Brutalist",
  character: "Raw concrete, massive geometric forms, repetitive patterns. Monolithic, imposing.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 5.0,
    wallThickness: 0.15,
    roofHeightRatio: 0.05,
    baseHeight: 1.0,
  },

  palette: {
    wall: "#8a8580",
    roof: "#7a7570",
    trim: "#6a6560",
    opening: "#1a1a22",
    structure: "#9a9590",
    stroke: "#3a3530",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-masonry", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-flat"],
  windowTypes: ["window-single", "window-ribbon"],
  doorTypes: ["door-simple"],
  decorativeElements: ["rustication"],
};

registerStyle(brutalist);
