import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const sculptural: StyleGrammar = {
  id: "sculptural",
  name: "Sculptural",
  character: "Expressive, unique. Building as art object, non-functional forms, bold geometry.",

  proportions: {
    storyHeight: 4.0,
    bayWidth: 5.0,
    wallThickness: 0.05,
    roofHeightRatio: 0.25,
    baseHeight: 1.0,
  },

  palette: {
    wall: "#d8d0c8",
    roof: "#a8a098",
    trim: "#807870",
    opening: "#383838",
    structure: "#c0b8b0",
    stroke: "#282828",
  },

  elements: {
    columns: [],
    arches: ["arch-parabolic"],
    walls: ["wall-curtain"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-flat"],
  windowTypes: ["window-ribbon", "window-oculus"],
  doorTypes: ["door-simple"],
  decorativeElements: [],
};

registerStyle(sculptural);
