import type { Camera, Viewport, Vec3, ProjectedPoint } from "@genart-dev/projection";
import {
  createCamera,
  viewProjectionMatrix,
  projectWithMatrix,
  isBackFace,
  scaleAtDepth,
  depthSort,
  frustumContainsBox,
} from "@genart-dev/projection";
import type {
  WorldQuad,
  ScreenQuad,
  ElementInstance,
  ElementRenderResult,
  Building,
  RenderStyle,
  StylePalette,
} from "../types.js";
import { getElementRenderer } from "../elements/index.js";
import { darken, lighten, lerpColor } from "../shared/color-utils.js";
import { mulberry32 } from "../shared/prng.js";

// ---------------------------------------------------------------------------
// Camera resolution from layer properties (reads perspective:camera layer)
// ---------------------------------------------------------------------------

/**
 * Resolve a Camera from RenderResources.
 * Falls back to a default landscape camera if no camera layer is present.
 */
export function resolveCamera(resources: Record<string, unknown>): Camera {
  const cam = resources.camera as Camera | undefined;
  if (cam) return cam;
  return createCamera();
}

/**
 * Create a Viewport from canvas dimensions.
 */
export function makeViewport(width: number, height: number): Viewport {
  return { x: 0, y: 0, width, height };
}

// ---------------------------------------------------------------------------
// Project world quads to screen space
// ---------------------------------------------------------------------------

/**
 * Project a WorldQuad to ScreenQuad using a camera and viewport.
 * Handles back-face culling.
 */
export function projectQuad(
  quad: WorldQuad,
  camera: Camera,
  viewport: Viewport,
): ScreenQuad {
  const vpMatrix = viewProjectionMatrix(camera, viewport);

  // Back-face culling
  const center: Vec3 = {
    x: (quad.corners[0].x + quad.corners[1].x + quad.corners[2].x + quad.corners[3].x) / 4,
    y: (quad.corners[0].y + quad.corners[1].y + quad.corners[2].y + quad.corners[3].y) / 4,
    z: (quad.corners[0].z + quad.corners[1].z + quad.corners[2].z + quad.corners[3].z) / 4,
  };

  if (isBackFace(quad.normal, center, camera)) {
    return {
      corners: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      depth: -1,
      scale: 0,
      visible: false,
    };
  }

  // Project each corner
  const projected: ProjectedPoint[] = quad.corners.map((c) =>
    projectWithMatrix(c, vpMatrix, camera, viewport),
  );

  const anyVisible = projected.some((p) => p.visible);
  const avgDepth = projected.reduce((s, p) => s + p.depth, 0) / 4;
  const avgScale = projected.reduce((s, p) => s + p.scale, 0) / 4;

  return {
    corners: projected.map((p) => ({ x: p.x, y: p.y })) as unknown as ScreenQuad["corners"],
    depth: avgDepth,
    scale: avgScale,
    visible: anyVisible,
  };
}

/**
 * Project many quads efficiently with a precomputed VP matrix.
 */
export function projectQuads(
  quads: WorldQuad[],
  camera: Camera,
  viewport: Viewport,
): ScreenQuad[] {
  const vpMatrix = viewProjectionMatrix(camera, viewport);

  return quads.map((quad) => {
    const center: Vec3 = {
      x: (quad.corners[0].x + quad.corners[1].x + quad.corners[2].x + quad.corners[3].x) / 4,
      y: (quad.corners[0].y + quad.corners[1].y + quad.corners[2].y + quad.corners[3].y) / 4,
      z: (quad.corners[0].z + quad.corners[1].z + quad.corners[2].z + quad.corners[3].z) / 4,
    };

    if (isBackFace(quad.normal, center, camera)) {
      return {
        corners: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }] as ScreenQuad["corners"],
        depth: -1,
        scale: 0,
        visible: false,
      };
    }

    const projected = quad.corners.map((c) =>
      projectWithMatrix(c, vpMatrix, camera, viewport),
    );

    return {
      corners: projected.map((p) => ({ x: p.x, y: p.y })) as unknown as ScreenQuad["corners"],
      depth: projected.reduce((s, p) => s + p.depth, 0) / 4,
      scale: projected.reduce((s, p) => s + p.scale, 0) / 4,
      visible: projected.some((p) => p.visible),
    };
  });
}

// ---------------------------------------------------------------------------
// Building frustum test
// ---------------------------------------------------------------------------

/**
 * Test whether a building is visible in the camera frustum.
 */
export function isBuildingVisible(
  building: Building,
  camera: Camera,
  viewport: Viewport,
): boolean {
  const box = {
    min: {
      x: building.position.x - building.width / 2,
      y: building.position.y,
      z: building.position.z - building.depth / 2,
    },
    max: {
      x: building.position.x + building.width / 2,
      y: building.position.y + building.height,
      z: building.position.z + building.depth / 2,
    },
  };

  return frustumContainsBox(box, camera, viewport) !== "outside";
}

// ---------------------------------------------------------------------------
// Depth-aware render style
// ---------------------------------------------------------------------------

/** Hint about what kind of element is being rendered — affects fill color. */
export type ElementHint = "wall" | "roof" | "opening" | "structure" | "decorative";

/**
 * Compute a render style adjusted for distance from the camera.
 * Farther objects get thinner strokes, lower opacity, lower detail.
 *
 * `faceDot` is the dot product of the face normal with the light direction
 * (range -1 to 1). Positive = lit, negative = shadow. Used for directional shading.
 */
export function depthAdjustedStyle(
  palette: StylePalette,
  depth: number,
  scale: number,
  detail: number,
  wireframe: boolean,
  hint: ElementHint = "wall",
  faceDot: number = 0,
): RenderStyle {
  // Atmospheric fade: objects further away become lighter / less saturated
  const atmosphereFade = Math.max(0, Math.min(1, depth * 0.8));

  // Base fill color depends on element type
  let baseFill: string;
  switch (hint) {
    case "roof":
      baseFill = palette.roof;
      break;
    case "opening":
      baseFill = palette.opening;
      break;
    case "structure":
      baseFill = palette.structure;
      break;
    case "decorative":
      baseFill = palette.trim;
      break;
    default:
      baseFill = palette.wall;
  }

  // Directional shading: darken shadow-facing sides, lighten lit sides
  const shadingAmount = faceDot * 0.2; // subtle: ±20% darken/lighten
  const shadedFill = shadingAmount < 0
    ? darken(baseFill, -shadingAmount)
    : lighten(baseFill, shadingAmount);

  // Atmospheric blend toward background for distant objects
  const finalFill = atmosphereFade > 0.1
    ? lerpColor(shadedFill, "#d8d4d0", atmosphereFade * 0.4)
    : shadedFill;

  // Stroke: atmospheric fade lightens the stroke for distant objects
  const finalStroke = atmosphereFade > 0.3
    ? lerpColor(palette.stroke, "#a0988c", atmosphereFade * 0.5)
    : palette.stroke;

  return {
    strokeColor: finalStroke,
    fillColor: finalFill,
    // 3x multiplier vs old formula — visible strokes at all scales
    strokeWeight: Math.max(0.8, (1 - atmosphereFade * 0.4) * Math.min(4, scale * 0.06)),
    opacity: Math.max(0.3, 1 - atmosphereFade * 0.5),
    detail: detail * (1 - atmosphereFade * 0.5),
    wireframe,
  };
}

// ---------------------------------------------------------------------------
// Full building render pipeline
// ---------------------------------------------------------------------------

/** Render result item for depth sorting across buildings. */
export interface RenderItem {
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

// ---------------------------------------------------------------------------
// Light direction (fixed sun from upper-left-front)
// ---------------------------------------------------------------------------

/** Normalized light direction vector — upper-left, slightly forward. */
const LIGHT_DIR: Vec3 = (() => {
  const lx = -0.5, ly = 0.7, lz = 0.5;
  const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
  return { x: lx / len, y: ly / len, z: lz / len };
})();

/** Classify an element type into a rendering hint. */
function classifyElement(type: string): ElementHint {
  if (type.startsWith("roof-")) return "roof";
  if (type.startsWith("window-") || type.startsWith("door-")) return "opening";
  if (type.startsWith("column-") || type.startsWith("pilaster") || type.startsWith("beam-") || type.startsWith("buttress-")) return "structure";
  if (["cornice", "frieze", "string-course", "quoins", "rustication", "tracery", "timber-framing", "zellige", "mashrabiya"].includes(type)) return "decorative";
  return "wall";
}

/**
 * Produce renderable items for a building — projects all elements
 * through the camera and returns depth-sorted draw commands.
 */
export function renderBuilding(
  building: Building,
  camera: Camera,
  viewport: Viewport,
  palette: StylePalette,
  wireframe: boolean,
): RenderItem[] {
  const rand = mulberry32(building.config.seed);
  const items: RenderItem[] = [];

  for (const element of building.elements) {
    const renderer = getElementRenderer(element.type);
    const result = renderer(element, rand);
    const projected = projectQuads(result.quads, camera, viewport);

    // Average depth for sorting this element
    const visibleQuads = projected.filter((q) => q.visible);
    if (visibleQuads.length === 0) continue;

    const avgDepth = visibleQuads.reduce((s, q) => s + q.depth, 0) / visibleQuads.length;
    const avgScale = visibleQuads.reduce((s, q) => s + q.scale, 0) / visibleQuads.length;

    // Compute average face dot product with light direction for shading
    const hint = classifyElement(element.type);
    let avgDot = 0;
    if (result.quads.length > 0) {
      let dotSum = 0;
      for (const quad of result.quads) {
        const n = quad.normal;
        const len = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
        if (len > 0) {
          dotSum += (n.x * LIGHT_DIR.x + n.y * LIGHT_DIR.y + n.z * LIGHT_DIR.z) / len;
        }
      }
      avgDot = dotSum / result.quads.length;
    }

    const style = depthAdjustedStyle(palette, avgDepth, avgScale, element.detail, wireframe, hint, avgDot);

    items.push({
      depth: avgDepth,
      draw: (ctx) => result.draw(ctx, projected, style),
    });
  }

  // Sort back to front
  items.sort((a, b) => b.depth - a.depth);
  return items;
}
