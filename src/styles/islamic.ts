import type { StyleGrammar } from "../types.js";
import { registerStyle } from "./registry.js";

const islamic: StyleGrammar = {
  id: "islamic",
  name: "Islamic",
  character: "Courtyard-centered. Horseshoe arches, domes, minarets, geometric patterns.",

  proportions: {
    storyHeight: 4.5,
    bayWidth: 3.5,
    wallThickness: 0.09,
    roofHeightRatio: 0.35,
    baseHeight: 0.4,
  },

  palette: {
    wall: "#e8dbc0",
    roof: "#c8b898",
    trim: "#2875a8",
    opening: "#0a0a18",
    structure: "#d0c4a8",
    stroke: "#2a2018",
  },

  elements: {
    columns: ["column-simple", "pilaster"],
    arches: ["arch-horseshoe", "arch-pointed", "arch-ogee"],
    walls: ["wall-masonry"],
    buttresses: [],
  },

  roofForms: ["roof-dome", "roof-flat"],
  windowTypes: ["window-arched", "window-lancet", "window-oculus"],
  doorTypes: ["door-arched", "door-portal"],
  decorativeElements: ["zellige", "mashrabiya", "cornice", "string-course"],
};

registerStyle(islamic);
