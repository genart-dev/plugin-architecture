import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  JsonSchema,
  DesignLayer,
  LayerTransform,
  LayerProperties,
} from "@genart-dev/core";
import { buildingLayerType } from "./layers/building.js";
import { listStyles, listStyleGrammars, getStyle } from "./styles/index.js";
import { listRegisteredElements } from "./elements/index.js";
import type { ArchitecturalStyleName } from "./types.js";

// Ensure all registrations
import "./elements/index.js";
import "./styles/index.js";

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function generateLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fullCanvasTransform(ctx: McpToolContext): LayerTransform {
  return {
    x: 0,
    y: 0,
    width: ctx.canvasWidth,
    height: ctx.canvasHeight,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0,
    anchorY: 0,
  };
}

// ---------------------------------------------------------------------------
// add_building
// ---------------------------------------------------------------------------

const addBuildingTool: McpToolDefinition = {
  name: "add_building",
  description:
    "Add a generative building to the scene. Specify architectural style, scale, stories, bays, " +
    "roof form, and world-space position. The building is assembled from construction elements " +
    "(columns, arches, windows, walls, roof) using the style grammar. " +
    "Requires a perspective:camera layer for 3D projection. " +
    "Available styles: " + listStyles().join(", ") + ".",
  inputSchema: {
    type: "object",
    properties: {
      style: {
        type: "string",
        description: "Architectural style name.",
        enum: listStyles(),
      },
      scale: {
        type: "string",
        enum: ["cottage", "house", "townhouse", "tower", "civic", "monument", "megastructure"],
        description: "Building scale (default: house).",
      },
      stories: { type: "number", description: "Number of stories, 1-50 (default: 2)." },
      bays: { type: "number", description: "Number of bays / rhythm units, 1-12 (default: 3)." },
      roofForm: {
        type: "string",
        enum: ["roof-gable", "roof-hip", "roof-mansard", "roof-dome", "roof-barrel-vault", "roof-flat", "roof-spire"],
        description: "Roof form (default: style-dependent).",
      },
      positionX: { type: "number", description: "World X position (default: 0)." },
      positionZ: { type: "number", description: "World Z distance from camera (default: 30)." },
      rotationDeg: { type: "number", description: "Y-axis rotation in degrees (default: 0)." },
      constructionState: {
        type: "number",
        description: "0 = foundation only, 0.5 = complete, 1 = ruin (default: 0.5).",
      },
      seed: { type: "number", description: "PRNG seed for deterministic generation." },
    },
    required: ["style"],
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const style = input.style as string;
    const registered = listStyles();
    if (!registered.includes(style as ArchitecturalStyleName)) {
      return errorResult(`Unknown style '${style}'. Available: ${registered.join(", ")}.`);
    }

    const id = generateLayerId();
    const props: LayerProperties = buildingLayerType.createDefault();

    props.architecturalStyle = style;
    if (input.scale !== undefined) props.buildingScale = input.scale as string;
    if (input.stories !== undefined) props.stories = input.stories as number;
    if (input.bays !== undefined) props.bays = input.bays as number;
    if (input.roofForm !== undefined) props.roofForm = input.roofForm as string;
    if (input.positionX !== undefined) props.positionX = input.positionX as number;
    if (input.positionZ !== undefined) props.positionZ = input.positionZ as number;
    if (input.rotationDeg !== undefined) props.rotationDeg = input.rotationDeg as number;
    if (input.constructionState !== undefined) props.constructionState = input.constructionState as number;
    if (input.seed !== undefined) props.seed = input.seed as number;

    const layer: DesignLayer = {
      id,
      type: buildingLayerType.typeId,
      name: `Building (${style})`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: "normal",
      transform: fullCanvasTransform(context),
      properties: props,
    };

    context.layers.add(layer);
    context.emitChange("layer-added");

    const grammar = getStyle(style as ArchitecturalStyleName);
    return textResult(
      `Added ${style} building: ${props.stories} stories, ${props.bays} bays, ` +
      `${props.roofForm} roof, at (${props.positionX}, ${props.positionZ}). ` +
      `Character: ${grammar?.character ?? "unknown"}.`,
    );
  },
};

// ---------------------------------------------------------------------------
// set_building_style
// ---------------------------------------------------------------------------

const setBuildingStyleTool: McpToolDefinition = {
  name: "set_building_style",
  description:
    "Change the architectural style of an existing building layer. " +
    "Available styles: " + listStyles().join(", ") + ".",
  inputSchema: {
    type: "object",
    properties: {
      layerId: { type: "string", description: "Building layer ID (omit to use first building layer)." },
      style: {
        type: "string",
        description: "New architectural style.",
        enum: listStyles(),
      },
    },
    required: ["style"],
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const style = input.style as string;
    if (!listStyles().includes(style as ArchitecturalStyleName)) {
      return errorResult(`Unknown style '${style}'.`);
    }

    let layer: DesignLayer | undefined;
    if (input.layerId) {
      layer = context.layers.getAll().find((l) => l.id === input.layerId);
    } else {
      layer = context.layers.getAll().find((l) => l.type === "architecture:building");
    }

    if (!layer) return errorResult("No architecture:building layer found.");

    const props = { ...layer.properties, architecturalStyle: style } as LayerProperties;
    context.layers.updateProperties(layer.id, props);
    context.emitChange("layer-updated");

    const grammar = getStyle(style as ArchitecturalStyleName);
    return textResult(`Changed building to ${style}. Character: ${grammar?.character ?? "unknown"}.`);
  },
};

// ---------------------------------------------------------------------------
// list_architecture_styles
// ---------------------------------------------------------------------------

const listArchitectureStylesTool: McpToolDefinition = {
  name: "list_architecture_styles",
  description: "List all available architectural styles with their character descriptions.",
  inputSchema: {
    type: "object",
    properties: {},
  } satisfies JsonSchema,

  async handler(_input: Record<string, unknown>, _context: McpToolContext): Promise<McpToolResult> {
    const grammars = listStyleGrammars();
    const lines = grammars.map((g) => `• ${g.id} — ${g.name}: ${g.character}`);
    return textResult(
      `${grammars.length} architectural styles available:\n${lines.join("\n")}`,
    );
  },
};

// ---------------------------------------------------------------------------
// list_architecture_elements
// ---------------------------------------------------------------------------

const listArchitectureElementsTool: McpToolDefinition = {
  name: "list_architecture_elements",
  description: "List all registered construction element types (columns, arches, windows, roofs, etc.).",
  inputSchema: {
    type: "object",
    properties: {},
  } satisfies JsonSchema,

  async handler(_input: Record<string, unknown>, _context: McpToolContext): Promise<McpToolResult> {
    const elements = listRegisteredElements();
    const categories: Record<string, string[]> = {};

    for (const el of elements) {
      const cat = el.split("-")[0] ?? "other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(el);
    }

    const lines = Object.entries(categories).map(
      ([cat, els]) => `${cat}: ${els.join(", ")}`,
    );

    return textResult(
      `${elements.length} construction element types:\n${lines.join("\n")}`,
    );
  },
};

// ---------------------------------------------------------------------------
// set_construction_state
// ---------------------------------------------------------------------------

const setConstructionStateTool: McpToolDefinition = {
  name: "set_construction_state",
  description:
    "Set the construction state of a building: 0 = foundation only, 0.25 = structure, " +
    "0.5 = complete, 0.75 = aged, 1.0 = ruin. Intermediate values produce partial states.",
  inputSchema: {
    type: "object",
    properties: {
      layerId: { type: "string", description: "Building layer ID (omit to use first building)." },
      state: {
        type: "number",
        description: "Construction state 0-1.",
      },
    },
    required: ["state"],
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const state = input.state as number;
    if (state < 0 || state > 1) return errorResult("State must be 0-1.");

    let layer: DesignLayer | undefined;
    if (input.layerId) {
      layer = context.layers.getAll().find((l) => l.id === input.layerId);
    } else {
      layer = context.layers.getAll().find((l) => l.type === "architecture:building");
    }

    if (!layer) return errorResult("No architecture:building layer found.");

    const props = { ...layer.properties, constructionState: state } as LayerProperties;
    context.layers.updateProperties(layer.id, props);
    context.emitChange("layer-updated");

    const label = state < 0.1 ? "foundation" :
      state < 0.3 ? "structure" :
      state < 0.55 ? "complete" :
      state < 0.8 ? "aged" : "ruin";

    return textResult(`Set construction state to ${state.toFixed(2)} (${label}).`);
  },
};

// ---------------------------------------------------------------------------
// Export all tools
// ---------------------------------------------------------------------------

export const architectureMcpTools: McpToolDefinition[] = [
  addBuildingTool,
  setBuildingStyleTool,
  listArchitectureStylesTool,
  listArchitectureElementsTool,
  setConstructionStateTool,
];
