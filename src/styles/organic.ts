import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const organic: StyleGrammar = {
  id: "organic",
  name: "Organic",
  character: "Biomorphic, cave-like. Shell structures, earth-integrated, grown not built.",

  proportions: {
    storyHeight: 3.5,
    bayWidth: 4.0,
    wallThickness: 0.08,
    roofHeightRatio: 0.4,
    baseHeight: 0.3,
  },

  palette: {
    wall: "#c8b898",
    roof: "#908068",
    trim: "#a09078",
    opening: "#303028",
    structure: "#b0a088",
    stroke: "#3a3028",
  },

  elements: {
    columns: [],
    arches: ["arch-parabolic", "arch-round"],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-barrel-vault"],
  windowTypes: ["window-oculus", "window-arched"],
  doorTypes: ["door-arched"],
  decorativeElements: [],
};

registerStyle(organic);
