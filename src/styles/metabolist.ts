import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const metabolist: StyleGrammar = {
  id: "metabolist",
  name: "Metabolist",
  character: "Modular, biological. Capsule units, megastructure cores, plug-in modules.",

  proportions: {
    storyHeight: 3.0,
    bayWidth: 3.0,
    wallThickness: 0.05,
    roofHeightRatio: 0.1,
    baseHeight: 2.0,
  },

  palette: {
    wall: "#c8c4c0",
    roof: "#888480",
    trim: "#686460",
    opening: "#303038",
    structure: "#989490",
    stroke: "#303030",
  },

  elements: {
    columns: ["column-simple"],
    arches: [],
    walls: ["wall-curtain", "wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-flat"],
  windowTypes: ["window-single", "window-oculus"],
  doorTypes: ["door-simple"],
  decorativeElements: [],
};

registerStyle(metabolist);
