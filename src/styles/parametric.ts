import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const parametric: StyleGrammar = {
  id: "parametric",
  name: "Parametric",
  character: "Flowing, organic. Algorithmically-derived curves, complex surfaces, digital fabrication.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 5.0,
    wallThickness: 0.03,
    roofHeightRatio: 0.2,
    baseHeight: 0.5,
  },

  palette: {
    wall: "#e0dcd8",
    roof: "#b8b4b0",
    trim: "#908c88",
    opening: "#607888",
    structure: "#c0bcb8",
    stroke: "#404040",
  },

  elements: {
    columns: [],
    arches: ["arch-parabolic"],
    walls: ["wall-glass", "wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-flat"],
  windowTypes: ["window-ribbon"],
  doorTypes: ["door-simple"],
  decorativeElements: ["parametric-panel"],
};

registerStyle(parametric);
