// Import all style grammars to register them.
// Historical (14)
import "./classical.js";
import "./roman.js";
import "./romanesque.js";
import "./gothic.js";
import "./islamic.js";
import "./chinese.js";
import "./japanese.js";
import "./tudor.js";
import "./renaissance.js";
import "./baroque.js";
import "./georgian.js";
import "./art-nouveau.js";
import "./art-deco.js";
import "./vernacular.js";
// Modern (5)
import "./modernist.js";
import "./brutalist.js";
import "./high-tech.js";
import "./deconstructivist.js";
import "./parametric.js";
// Experimental (5)
import "./futuristic.js";
import "./sculptural.js";
import "./metabolist.js";
import "./organic.js";
import "./fantasy.js";

export {
  registerStyle,
  getStyle,
  listStyles,
  listStyleGrammars,
  requireStyle,
} from "./registry.js";
