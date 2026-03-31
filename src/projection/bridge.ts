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
import {
  resolveDepth,
  DEPTH_STANDARD,
  DEPTH_DRAMATIC,
  DEPTH_SUBTLE,
} from "@genart-dev/illustration";
import type { AtmosphericDepthConfig } from "@genart-dev/illustration";

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

/** Pick atmospheric depth preset by render mode. */
function depthPresetForMode(mode: RenderMode): AtmosphericDepthConfig {
  switch (mode) {
    case "woodcut": return DEPTH_DRAMATIC;
    case "technical": return DEPTH_SUBTLE;
    default: return DEPTH_STANDARD;
  }
}

/**
 * Compute a render style adjusted for distance from the camera.
 * Uses @genart-dev/illustration's resolveDepth() for coordinated
 * atmospheric perspective (weight, opacity, density, detail).
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
  // Phase 5: Use illustration's resolveDepth() for coordinated atmospheric fade
  const depthConfig = depthPresetForMode(renderMode);
  const resolved = resolveDepth(depth, depthConfig);

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

  // Directional shading: darken shadow faces, leave lit faces at base color.
  // No lightening — base palette colors are already light, and lightening
  // makes lit faces indistinguishable from the background.
  const shadedFill = faceDot < 0
    ? darken(baseFill, Math.min(0.5, -faceDot * 0.5))
    : baseFill;

  // Atmospheric blend — fade toward background based on resolved opacity
  const atmosphereFade = 1 - resolved.opacity;
  const finalFill = atmosphereFade > 0.05
    ? lerpColor(shadedFill, "#d8d4d0", atmosphereFade * 0.6)
    : shadedFill;

  const finalStroke = atmosphereFade > 0.1
    ? lerpColor(palette.stroke, "#a0988c", atmosphereFade * 0.7)
    : palette.stroke;

  return {
    strokeColor: finalStroke,
    fillColor: finalFill,
    // Weight from resolveDepth, with minimum floor
    strokeWeight: Math.max(1.2, resolved.weight * Math.min(5, scale * 0.08)),
    // Opacity: filled mode = fully opaque (depth sorting handles occlusion);
    // illustration modes can fade for atmospheric perspective
    opacity: renderMode === "filled" ? 1.0 : Math.max(0.6, resolved.opacity),
    detail: detail * resolved.detail,
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
  /** Sort key — linear world-space distance from camera (larger = further). */
  depth: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

/** Compute linear distance from camera to a world-space point (for sorting). */
function linearDepth(point: Vec3, camera: Camera): number {
  const dx = point.x - camera.position.x;
  const dy = point.y - camera.position.y;
  const dz = point.z - camera.position.z;
  return dx * dx + dy * dy + dz * dz; // squared distance is fine for sorting
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

    // Group ALL elements — each element draws as one unit to prevent
    // depth sort interleaving between quads of different elements.
    const hasCustomDraw = true;

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

      // Linear distance for sort (average of group world quad centers)
      let sortDepth = 0;
      for (const wq of groupWorld) {
        const cx = (wq.corners[0].x + wq.corners[2].x) / 2;
        const cy = (wq.corners[0].y + wq.corners[2].y) / 2;
        const cz = (wq.corners[0].z + wq.corners[2].z) / 2;
        sortDepth += linearDepth({ x: cx, y: cy, z: cz }, camera);
      }
      sortDepth /= groupWorld.length;

      items.push({
        depth: sortDepth,
        draw: (ctx) => er.result.draw(ctx, groupQuads, style),
      });
    } else {
      // Per-quad: each visible quad is its own depth-sorted item
      if (!csq.visible) continue;

      const wq = allWorldQuads[qi]!;
      const dotVal = faceLightDot(wq.normal);
      const style = depthAdjustedStyle(palette, csq.depth, csq.scale, rec.detail, wireframe, rec.hint, dotVal, renderMode);

      // Linear distance from camera for sort key
      const cx = (wq.corners[0].x + wq.corners[2].x) / 2;
      const cy = (wq.corners[0].y + wq.corners[2].y) / 2;
      const cz = (wq.corners[0].z + wq.corners[2].z) / 2;

      const quad = csq;
      items.push({
        depth: linearDepth({ x: cx, y: cy, z: cz }, camera),
        draw: (ctx) => rec.draw(ctx, [quad], style),
      });
    }
  }

  // Sort back to front (larger distance = further = drawn first)
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
