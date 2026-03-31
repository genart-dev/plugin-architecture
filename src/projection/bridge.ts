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
  ClassifiedScreenQuad,
  ElementInstance,
  ElementRenderResult,
  Building,
  RenderStyle,
  RenderMode,
  StylePalette,
  FaceLighting,
} from "../types.js";
import { getElementRenderer } from "../elements/index.js";
import { darken, lighten, lerpColor } from "../shared/color-utils.js";
import { mulberry32 } from "../shared/prng.js";
import { classifyProjectedQuads } from "./edge-classify.js";

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
/** Compute centroid of a quad's unique corners (handles degenerate quads). */
function quadCentroid(corners: readonly [Vec3, Vec3, Vec3, Vec3]): Vec3 {
  const eps = 0.001;
  const same = (a: Vec3, b: Vec3) =>
    Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps && Math.abs(a.z - b.z) <= eps;

  // Deduplicate adjacent corners
  const all: Vec3[] = [corners[0], corners[1], corners[2], corners[3]];
  const unique: Vec3[] = [all[0]!];
  for (let i = 1; i < 4; i++) {
    if (!same(all[i]!, unique[unique.length - 1]!)) {
      unique.push(all[i]!);
    }
  }
  if (unique.length > 1 && same(unique[unique.length - 1]!, unique[0]!)) {
    unique.pop();
  }

  const n = unique.length || 1;
  return {
    x: unique.reduce((s, p) => s + p.x, 0) / n,
    y: unique.reduce((s, p) => s + p.y, 0) / n,
    z: unique.reduce((s, p) => s + p.z, 0) / n,
  };
}

export function projectQuad(
  quad: WorldQuad,
  camera: Camera,
  viewport: Viewport,
): ScreenQuad {
  const vpMatrix = viewProjectionMatrix(camera, viewport);

  // Back-face culling — use centroid of unique corners for degenerate quads
  const center = quadCentroid(quad.corners);

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
    const center = quadCentroid(quad.corners);

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

/** Classify face lighting from light dot product. */
function classifyLighting(faceDot: number): FaceLighting {
  if (faceDot > 0.3) return "lit";
  if (faceDot > -0.2) return "ambient";
  return "shadow";
}

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
  renderMode: RenderMode = "filled",
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
  // Very strong contrast (±60%) — shadow faces must be clearly distinct from lit faces
  const shadingAmount = faceDot * 0.6;
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
    // Edges must always read — 1.2 minimum, scale-responsive
    strokeWeight: Math.max(1.2, (1 - atmosphereFade * 0.4) * Math.min(5, scale * 0.08)),
    // Never go below 0.6 — buildings must read as solid, not ghostly
    opacity: Math.max(0.6, 1 - atmosphereFade * 0.3),
    detail: detail * (1 - atmosphereFade * 0.5),
    wireframe,
    renderMode,
    lighting: classifyLighting(faceDot),
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

/** Compute the normalized dot product of a normal with the light direction. */
function faceLightDot(normal: Vec3): number {
  const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  if (len === 0) return 0;
  return (normal.x * LIGHT_DIR.x + normal.y * LIGHT_DIR.y + normal.z * LIGHT_DIR.z) / len;
}

/** Metadata tracked per-quad during the two-pass pipeline. */
interface QuadRecord {
  /** Index of the element that produced this quad. */
  elementIdx: number;
  /** The element's draw function. */
  draw: ElementRenderResult["draw"];
  /** Rendering hint. */
  hint: ElementHint;
  /** Element detail level. */
  detail: number;
  /** Whether this element uses grouped (custom) draw logic. */
  grouped: boolean;
}

/**
 * Produce renderable items for a building — projects all elements
 * through the camera and returns **per-quad** depth-sorted draw commands.
 *
 * Two-pass pipeline:
 * 1. Collect all WorldQuads from all elements
 * 2. Project + classify edges for the whole building at once
 * 3. Create RenderItems with classified quads and edge-weighted styles
 */
export function renderBuilding(
  building: Building,
  camera: Camera,
  viewport: Viewport,
  palette: StylePalette,
  wireframe: boolean,
  renderMode: RenderMode = "filled",
): RenderItem[] {
  const rand = mulberry32(building.config.seed);

  // ── Pass 1: Collect all world quads ──
  const allWorldQuads: WorldQuad[] = [];
  const quadRecords: QuadRecord[] = [];
  const elementResults: { result: ElementRenderResult; element: ElementInstance; startIdx: number; count: number }[] = [];

  for (let ei = 0; ei < building.elements.length; ei++) {
    const element = building.elements[ei]!;
    const renderer = getElementRenderer(element.type);
    const result = renderer(element, rand);
    const hint = classifyElement(element.type);

    const hasCustomDraw = hint === "opening"
      || element.type === "wall-timber-frame"
      || element.type === "wall-glass"
      || element.type === "glass-curtain-wall";

    const startIdx = allWorldQuads.length;

    for (const wq of result.quads) {
      allWorldQuads.push(wq);
      quadRecords.push({
        elementIdx: ei,
        draw: result.draw,
        hint,
        detail: element.detail,
        grouped: hasCustomDraw,
      });
    }

    elementResults.push({ result, element, startIdx, count: result.quads.length });
  }

  // ── Pass 2: Project all quads + classify edges ──
  const vpMatrix = viewProjectionMatrix(camera, viewport);
  const screenQuads = projectQuadsBatch(allWorldQuads, camera, viewport, vpMatrix);

  // Classify edges across the entire building
  const classified = classifyProjectedQuads(
    allWorldQuads, screenQuads, camera, viewport, vpMatrix,
  );

  // ── Pass 3: Create RenderItems ──
  const items: RenderItem[] = [];

  // Track which grouped elements we've already emitted
  const emittedGroups = new Set<number>();

  for (let qi = 0; qi < classified.length; qi++) {
    const csq = classified[qi]!;
    const rec = quadRecords[qi]!;

    if (rec.grouped) {
      // Grouped elements: emit once per element (windows, doors, etc.)
      if (emittedGroups.has(rec.elementIdx)) continue;
      emittedGroups.add(rec.elementIdx);

      const er = elementResults.find((e) => e.startIdx <= qi && qi < e.startIdx + e.count)!;
      const groupQuads = classified.slice(er.startIdx, er.startIdx + er.count);
      const groupWorld = allWorldQuads.slice(er.startIdx, er.startIdx + er.count);

      const visibleQuads = groupQuads.filter((q) => q.visible);
      if (visibleQuads.length === 0) continue;

      const avgDepth = visibleQuads.reduce((s, q) => s + q.depth, 0) / visibleQuads.length;
      const avgScale = visibleQuads.reduce((s, q) => s + q.scale, 0) / visibleQuads.length;
      const avgDot = groupWorld.reduce((s, q) => s + faceLightDot(q.normal), 0) / groupWorld.length;
      const style = depthAdjustedStyle(palette, avgDepth, avgScale, rec.detail, wireframe, rec.hint, avgDot, renderMode);

      items.push({
        depth: avgDepth,
        draw: (ctx) => er.result.draw(ctx, groupQuads, style),
      });
    } else {
      // Per-quad: each visible quad is its own depth-sorted item
      if (!csq.visible) continue;

      const dotVal = faceLightDot(allWorldQuads[qi]!.normal);
      const style = depthAdjustedStyle(palette, csq.depth, csq.scale, rec.detail, wireframe, rec.hint, dotVal, renderMode);

      // Capture csq in closure for the draw call
      const quad = csq;
      items.push({
        depth: csq.depth,
        draw: (ctx) => rec.draw(ctx, [quad], style),
      });
    }
  }

  // Sort back to front
  items.sort((a, b) => b.depth - a.depth);
  return items;
}

/**
 * Project many quads with a precomputed VP matrix (batch variant for renderBuilding).
 */
function projectQuadsBatch(
  quads: WorldQuad[],
  camera: Camera,
  viewport: Viewport,
  vpMatrix: Float64Array,
): ScreenQuad[] {
  return quads.map((quad) => {
    const center = quadCentroid(quad.corners);

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
