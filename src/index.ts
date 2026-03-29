/**
 * @genart-dev/plugin-architecture — Generative architecture for genart.dev
 *
 * Ground-up generative architecture system with 40+ construction elements,
 * 24 style grammars, perspective-projected buildings, and illustration
 * rendering modes (pencil, ink, technical, engraving, woodcut).
 *
 * v0.2.0: Illustration integration — replaces Canvas2D fill+stroke with
 * @genart-dev/illustration mark and fill strategies for hand-drawn rendering.
 * 6 render modes, 15 layer properties, 88 tests.
 */

import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { buildingLayerType } from "./layers/index.js";
import { architectureMcpTools } from "./architecture-tools.js";

// Ensure all elements and styles register on import
import "./elements/index.js";
import "./styles/index.js";

const architecturePlugin: DesignPlugin = {
  id: "architecture",
  name: "Architecture",
  version: "0.1.0",
  description:
    "Generative architecture: 40+ construction elements (columns, arches, windows, doors, roofs, walls, " +
    "decorative ornament, modern structural systems), 24 architectural style grammars (14 historical + " +
    "5 modern + 5 experimental), perspective-projected buildings via @genart-dev/projection, " +
    "construction state progression (foundation → complete → ruin), 22 presets, 5 MCP tools.",

  layerTypes: [buildingLayerType],
  tools: [],
  exportHandlers: [],
  mcpTools: architectureMcpTools,

  async initialize(_context: PluginContext): Promise<void> {},
  dispose(): void {},
};

export default architecturePlugin;

// Layer types
export { buildingLayerType } from "./layers/index.js";
export type { BuildingLayerProps } from "./layers/index.js";

// Compositor
export { compositeBuilding, defaultBuildingConfig } from "./compositor.js";

// Styles
export { listStyles, listStyleGrammars, getStyle, requireStyle } from "./styles/index.js";

// Elements
export { getElementRenderer, listRegisteredElements } from "./elements/index.js";

// Projection bridge
export {
  resolveCamera,
  makeViewport,
  projectQuad,
  projectQuads,
  isBuildingVisible,
  depthAdjustedStyle,
  renderBuilding,
} from "./projection/index.js";
export type { RenderItem } from "./projection/index.js";

// Illustration integration
export {
  drawQuadIllustrated,
  drawQuadWithHatchingIllustrated,
  drawMarks,
  getStrategy,
} from "./illustration/index.js";
export type { IllustrationStrategy } from "./illustration/index.js";

// Presets
export { ALL_PRESETS, getPreset, filterPresets, searchPresets } from "./presets/index.js";
export type { BuildingPreset } from "./presets/index.js";

// Tools
export { architectureMcpTools } from "./architecture-tools.js";

// Types
export type {
  RenderMode,
  ArchitecturalStyleName,
  HistoricalStyle,
  ModernStyle,
  ExperimentalStyle,
  ElementCategory,
  ElementType,
  WorldQuad,
  ScreenQuad,
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  BuildingScale,
  BuildingConfig,
  Building,
  StyleGrammar,
  StyleProportions,
  StylePalette,
  StyleElementPalette,
} from "./types.js";

// Shared utilities
export { mulberry32 } from "./shared/prng.js";
export { parseHex, toHex, lerpColor, darken, lighten, varyColor } from "./shared/color-utils.js";
