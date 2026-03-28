import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const baroque: StyleGrammar = {
  id: "baroque",
  name: "Baroque",
  character: "Theatrical, ornate. Classical vocabulary with dramatic curves, broken pediments, exuberant detail.",

  proportions: {
    storyHeight: 5.0,
    bayWidth: 3.5,
    wallThickness: 0.1,
    roofHeightRatio: 0.35,
    baseHeight: 1.0,
  },

  palette: {
    wall: "#ece0c8",
    roof: "#8a7860",
    trim: "#c8a868",
    opening: "#1a1820",
    structure: "#d8c8a0",
    stroke: "#2a2018",
  },

  elements: {
    columns: ["column-corinthian", "column-ionic", "pilaster"],
    arches: ["arch-round", "arch-ogee"],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-mansard", "roof-barrel-vault"],
  windowTypes: ["window-arched", "window-paired", "window-oculus"],
  doorTypes: ["door-portal", "door-double"],
  decorativeElements: ["cornice", "frieze", "string-course", "quoins"],
};

registerStyle(baroque);
