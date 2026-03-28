// Import all element renderers to register them.
// Order doesn't matter — registration is side-effect based.
import "./columns.js";
import "./arches.js";
import "./windows.js";
import "./doors.js";
import "./roofs.js";
import "./walls.js";
import "./decorative.js";
import "./modern.js";
import "./structural.js";

export {
  getElementRenderer,
  listRegisteredElements,
  registerElement,
  makeBox,
  drawQuad,
  drawQuadWithHatching,
} from "./renderer.js";
export type { ElementRenderer } from "./renderer.js";
