import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";
import type { Camera, Viewport, Vec3 } from "@genart-dev/projection";
import { createCamera, viewProjectionMatrix, projectWithMatrix } from "@genart-dev/projection";
import type { ArchitecturalStyleName, BuildingConfig, RenderMode } from "../types.js";
import { EDGE_WEIGHTS } from "../types.js";
import { compositeBuilding, defaultBuildingConfig } from "../compositor.js";
import { renderBuilding, makeViewport } from "../projection/index.js";
import { requireStyle, listStyles } from "../styles/index.js";

// Ensure all elements and styles are registered
import "../elements/index.js";
import "../styles/index.js";

// ---------------------------------------------------------------------------
// Property schema
// ---------------------------------------------------------------------------

const ALL_STYLES = [
  "classical", "roman", "romanesque", "gothic", "islamic",
  "chinese", "japanese", "tudor", "renaissance", "baroque",
  "georgian", "art-nouveau", "art-deco", "vernacular",
  "modernist", "brutalist", "high-tech", "deconstructivist", "parametric",
  "futuristic", "sculptural", "metabolist", "organic", "fantasy",
] as const;

const BUILDING_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "architecturalStyle",
    label: "Style",
    type: "select",
    default: "classical",
    options: ALL_STYLES.map((s) => ({ value: s, label: s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) })),
    group: "identity",
  },
  {
    key: "buildingScale",
    label: "Scale",
    type: "select",
    default: "house",
    options: [
      { value: "cottage", label: "Cottage" },
      { value: "house", label: "House" },
      { value: "townhouse", label: "Townhouse" },
      { value: "tower", label: "Tower" },
      { value: "civic", label: "Civic" },
      { value: "monument", label: "Monument" },
      { value: "megastructure", label: "Megastructure" },
    ],
    group: "identity",
  },
  {
    key: "stories",
    label: "Stories",
    type: "number",
    default: 2,
    min: 1,
    max: 50,
    step: 1,
    group: "form",
  },
  {
    key: "bays",
    label: "Bays",
    type: "number",
    default: 3,
    min: 1,
    max: 12,
    step: 1,
    group: "form",
  },
  {
    key: "footprintRatio",
    label: "Width/Depth Ratio",
    type: "number",
    default: 1.5,
    min: 0.5,
    max: 4,
    step: 0.1,
    group: "form",
  },
  {
    key: "roofForm",
    label: "Roof Form",
    type: "select",
    default: "roof-gable",
    options: [
      { value: "roof-gable", label: "Gable" },
      { value: "roof-hip", label: "Hip" },
      { value: "roof-mansard", label: "Mansard" },
      { value: "roof-dome", label: "Dome" },
      { value: "roof-barrel-vault", label: "Barrel Vault" },
      { value: "roof-flat", label: "Flat" },
      { value: "roof-spire", label: "Spire" },
    ],
    group: "form",
  },
  {
    key: "massingVariation",
    label: "Massing Variation",
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.05,
    group: "form",
  },
  {
    key: "constructionState",
    label: "Construction State",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    group: "state",
  },
  {
    key: "weathering",
    label: "Weathering",
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.05,
    group: "state",
  },
  {
    key: "positionX",
    label: "Position X",
    type: "number",
    default: 0,
    step: 1,
    group: "placement",
  },
  {
    key: "positionZ",
    label: "Position Z",
    type: "number",
    default: 30,
    min: 1,
    step: 1,
    group: "placement",
  },
  {
    key: "rotationDeg",
    label: "Rotation (degrees)",
    type: "number",
    default: 0,
    min: -180,
    max: 180,
    step: 5,
    group: "placement",
  },
  {
    key: "renderMode",
    label: "Render Mode",
    type: "select",
    default: "pencil",
    options: [
      { value: "filled", label: "Filled" },
      { value: "pencil", label: "Pencil Sketch" },
      { value: "ink", label: "Ink" },
      { value: "technical", label: "Technical Drawing" },
      { value: "engraving", label: "Engraving" },
      { value: "woodcut", label: "Woodcut" },
    ],
    group: "rendering",
  },
  {
    key: "wireframe",
    label: "Wireframe",
    type: "boolean",
    default: false,
    group: "rendering",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 42,
    min: 0,
    step: 1,
    group: "rendering",
  },
];

// ---------------------------------------------------------------------------
// Resolve properties
// ---------------------------------------------------------------------------

export interface BuildingLayerProps {
  architecturalStyle: ArchitecturalStyleName;
  buildingScale: string;
  stories: number;
  bays: number;
  footprintRatio: number;
  roofForm: string;
  massingVariation: number;
  constructionState: number;
  weathering: number;
  positionX: number;
  positionZ: number;
  rotationDeg: number;
  renderMode: RenderMode;
  wireframe: boolean;
  seed: number;
}

function resolveProps(properties: LayerProperties | Readonly<Record<string, unknown>>): BuildingLayerProps {
  return {
    architecturalStyle: (properties.architecturalStyle as ArchitecturalStyleName) ?? "classical",
    buildingScale: (properties.buildingScale as string) ?? "house",
    stories: (properties.stories as number) ?? 2,
    bays: (properties.bays as number) ?? 3,
    footprintRatio: (properties.footprintRatio as number) ?? 1.5,
    roofForm: (properties.roofForm as string) ?? "roof-gable",
    massingVariation: (properties.massingVariation as number) ?? 0,
    constructionState: (properties.constructionState as number) ?? 0.5,
    weathering: (properties.weathering as number) ?? 0,
    positionX: (properties.positionX as number) ?? 0,
    positionZ: (properties.positionZ as number) ?? 30,
    rotationDeg: (properties.rotationDeg as number) ?? 0,
    renderMode: (properties.renderMode as RenderMode) ?? "pencil",
    wireframe: (properties.wireframe as boolean) ?? false,
    seed: (properties.seed as number) ?? 42,
  };
}

// ---------------------------------------------------------------------------
// Layer type definition
// ---------------------------------------------------------------------------

export const buildingLayerType: LayerTypeDefinition = {
  typeId: "architecture:building",
  displayName: "Building",
  icon: "building",
  category: "draw",
  properties: BUILDING_PROPERTIES,
  propertyEditorId: "architecture:building-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of BUILDING_PROPERTIES) {
      props[schema.key] = schema.default;
    }
    return props;
  },

  render(
    properties: LayerProperties,
    ctx: CanvasRenderingContext2D,
    bounds: LayerBounds,
    resources: RenderResources,
  ): void {
    const p = resolveProps(properties);

    // Resolve camera from RenderResources (set by perspective:camera layer)
    const camera: Camera = (resources as unknown as Record<string, unknown>).camera as Camera ?? createCamera();
    const viewport: Viewport = makeViewport(bounds.width, bounds.height);

    const config: BuildingConfig = defaultBuildingConfig({
      style: p.architecturalStyle,
      scale: p.buildingScale as BuildingConfig["scale"],
      stories: p.stories,
      bays: p.bays,
      footprintRatio: p.footprintRatio,
      roofForm: p.roofForm as BuildingConfig["roofForm"],
      massingVariation: p.massingVariation,
      constructionState: p.constructionState,
      weathering: p.weathering,
      seed: p.seed,
    });

    const rotRad = (p.rotationDeg * Math.PI) / 180;
    const building = compositeBuilding(config, p.positionX, p.positionZ, rotRad);

    // Get style palette for rendering
    let palette;
    try {
      palette = requireStyle(p.architecturalStyle).palette;
    } catch {
      palette = {
        wall: "#e8dcc8",
        roof: "#c4956a",
        trim: "#d4c4a8",
        opening: "#1a1a2e",
        structure: "#d8cbb0",
        stroke: "#3a3020",
      };
    }

    const items = renderBuilding(building, camera, viewport, palette, p.wireframe, p.renderMode);

    ctx.save();

    // Ground shadow — projected ellipse at y=0 beneath the building
    const shadowPad = 0.3;
    const shw = building.width / 2 + shadowPad;
    const shd = building.depth / 2 + shadowPad;
    const bx = building.position.x;
    const bz = building.position.z;
    const vpMatrix = viewProjectionMatrix(camera, viewport);
    const shadowCorners: Vec3[] = [
      { x: bx - shw, y: 0.01, z: bz - shd },
      { x: bx + shw, y: 0.01, z: bz - shd },
      { x: bx + shw, y: 0.01, z: bz + shd },
      { x: bx - shw, y: 0.01, z: bz + shd },
    ];
    const projShadow = shadowCorners.map((c) => projectWithMatrix(c, vpMatrix, camera, viewport));
    if (projShadow.some((p2) => p2.visible)) {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#1a1a20";
      ctx.beginPath();
      ctx.moveTo(projShadow[0]!.x, projShadow[0]!.y);
      for (let i = 1; i < projShadow.length; i++) {
        ctx.lineTo(projShadow[i]!.x, projShadow[i]!.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Building quads
    for (const item of items) {
      item.draw(ctx);
    }

    // Phase 5: Cast shadow bands below projecting horizontal elements
    // Beaux-Arts convention: 45° sun from upper-left creates thin shadow
    // strips below cornices, string courses, and roof overhang.
    {
      const grammar = requireStyle(p.architecturalStyle);
      const storyH = grammar.proportions.storyHeight;
      const wallHeight = p.stories * storyH;
      const wallBaseY = grammar.proportions.baseHeight;
      const wallDepth = building.width * grammar.proportions.wallThickness;
      const shadowH = wallDepth * 0.7; // shadow height = projection depth × 0.7
      const frontZ = bz + building.depth / 2 + wallDepth / 2 + 0.02;

      // Collect Y positions of projecting elements
      const shadowYs: number[] = [];
      // Cornice at top of wall
      if (grammar.decorativeElements.length > 0) {
        shadowYs.push(wallBaseY + wallHeight);
      }
      // String courses between floors
      if (p.stories > 1 && grammar.decorativeElements.includes("string-course")) {
        for (let s = 1; s < p.stories; s++) {
          shadowYs.push(wallBaseY + s * storyH);
        }
      }

      for (const shadowTop of shadowYs) {
        const shadowBottom = Math.max(0, shadowTop - shadowH);
        const corners: Vec3[] = [
          { x: bx - building.width / 2, y: shadowBottom, z: frontZ },
          { x: bx + building.width / 2, y: shadowBottom, z: frontZ },
          { x: bx + building.width / 2, y: shadowTop, z: frontZ },
          { x: bx - building.width / 2, y: shadowTop, z: frontZ },
        ];
        const proj = corners.map((c) => projectWithMatrix(c, vpMatrix, camera, viewport));
        if (proj.some((pp) => pp.visible)) {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = "#1a1a20";
          ctx.beginPath();
          ctx.moveTo(proj[0]!.x, proj[0]!.y);
          for (let si = 1; si < proj.length; si++) {
            ctx.lineTo(proj[si]!.x, proj[si]!.y);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Ground contact line — heaviest line weight (ground edge class)
    const baseCorners: Vec3[] = [
      { x: bx - building.width / 2, y: 0, z: bz + building.depth / 2 },
      { x: bx + building.width / 2, y: 0, z: bz + building.depth / 2 },
    ];
    const projBase = baseCorners.map((c) => projectWithMatrix(c, vpMatrix, camera, viewport));
    if (projBase[0]!.visible && projBase[1]!.visible) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = palette.stroke;
      ctx.lineWidth = Math.max(2.5, 1.2 * EDGE_WEIGHTS.ground);
      ctx.beginPath();
      ctx.moveTo(projBase[0]!.x, projBase[0]!.y);
      ctx.lineTo(projBase[1]!.x, projBase[1]!.y);
      ctx.stroke();
    }

    ctx.restore();
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const p = resolveProps(properties);

    if (p.stories < 1 || p.stories > 50) {
      errors.push({ property: "stories", message: "Must be 1–50" });
    }
    if (p.bays < 1 || p.bays > 12) {
      errors.push({ property: "bays", message: "Must be 1–12" });
    }
    if (p.constructionState < 0 || p.constructionState > 1) {
      errors.push({ property: "constructionState", message: "Must be 0–1" });
    }

    // Check if style is registered
    const registered = listStyles();
    if (!registered.includes(p.architecturalStyle)) {
      errors.push({
        property: "architecturalStyle",
        message: `Unknown style '${p.architecturalStyle}'. Available: ${registered.join(", ")}`,
      });
    }

    return errors.length > 0 ? errors : null;
  },
};
