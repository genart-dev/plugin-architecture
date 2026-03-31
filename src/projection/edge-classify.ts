/**
 * Edge classification for architectural line weight hierarchy.
 *
 * Classifies each quad edge as silhouette, fold, detail, or ground
 * based on adjacency analysis — the same approach used in real
 * architectural illustration to create readable line drawings.
 */

import type { Camera, Viewport, Vec3 } from "@genart-dev/projection";
import { isBackFace } from "@genart-dev/projection";
import type {
  WorldQuad,
  ScreenQuad,
  ClassifiedScreenQuad,
  EdgeClass,
} from "../types.js";

// ---------------------------------------------------------------------------
// Edge key — canonical string for two world-space positions
// ---------------------------------------------------------------------------

/** Snap a coordinate to a grid for spatial hashing. */
function snap(v: number): number {
  return Math.round(v * 100); // 0.01 resolution
}

/** Canonical edge key: sorted pair of snapped corner positions. */
function edgeKey(a: Vec3, b: Vec3): string {
  const ax = snap(a.x), ay = snap(a.y), az = snap(a.z);
  const bx = snap(b.x), by = snap(b.y), bz = snap(b.z);

  // Sort so edge(a,b) === edge(b,a)
  if (ax < bx || (ax === bx && (ay < by || (ay === by && az < bz)))) {
    return `${ax},${ay},${az}|${bx},${by},${bz}`;
  }
  return `${bx},${by},${bz}|${ax},${ay},${az}`;
}

// ---------------------------------------------------------------------------
// Adjacency map
// ---------------------------------------------------------------------------

/** Entry in the adjacency map — tracks which quads share an edge. */
interface EdgeEntry {
  /** Indices of quads sharing this edge. */
  quadIndices: number[];
}

/**
 * Build an adjacency map for a set of world-space quads.
 * Maps each edge (pair of corners) to the quads that share it.
 */
export function buildEdgeAdjacency(quads: WorldQuad[]): Map<string, EdgeEntry> {
  const map = new Map<string, EdgeEntry>();

  for (let qi = 0; qi < quads.length; qi++) {
    const q = quads[qi]!;
    for (let ei = 0; ei < 4; ei++) {
      const a = q.corners[ei]!;
      const b = q.corners[(ei + 1) % 4]!;
      const key = edgeKey(a, b);

      let entry = map.get(key);
      if (!entry) {
        entry = { quadIndices: [] };
        map.set(key, entry);
      }
      // Avoid duplicate quad index for degenerate edges
      if (!entry.quadIndices.includes(qi)) {
        entry.quadIndices.push(qi);
      }
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Edge classification
// ---------------------------------------------------------------------------

/** Dot product of two Vec3. */
function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Length of a Vec3. */
function len(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Threshold below which a corner is considered "at ground level". */
const GROUND_Y_THRESHOLD = 0.05;

/**
 * Classify all 4 edges of a quad.
 *
 * Rules:
 * - Bottom edge of a quad whose corners are at y ≈ 0 → "ground"
 * - Edge shared by no other visible quad → "silhouette"
 * - Edge shared by a quad at a significantly different normal → "fold"
 * - Edge shared by a coplanar quad → "detail"
 */
export function classifyQuadEdges(
  quadIndex: number,
  worldQuads: WorldQuad[],
  visibleMask: boolean[],
  adjacency: Map<string, EdgeEntry>,
): [EdgeClass, EdgeClass, EdgeClass, EdgeClass] {
  const quad = worldQuads[quadIndex]!;
  const normal = quad.normal;
  const classes: EdgeClass[] = [];

  for (let ei = 0; ei < 4; ei++) {
    const a = quad.corners[ei]!;
    const b = quad.corners[(ei + 1) % 4]!;

    // Ground edge: both endpoints at y ≈ 0
    if (a.y < GROUND_Y_THRESHOLD && b.y < GROUND_Y_THRESHOLD) {
      classes.push("ground");
      continue;
    }

    const key = edgeKey(a, b);
    const entry = adjacency.get(key);

    // Find adjacent visible quads (not ourselves)
    const neighbors = entry
      ? entry.quadIndices.filter((qi) => qi !== quadIndex && visibleMask[qi])
      : [];

    if (neighbors.length === 0) {
      // No visible neighbor shares this edge → silhouette
      classes.push("silhouette");
      continue;
    }

    // Check angle between our normal and the neighbor's normal
    let maxAngle = 0;
    for (const ni of neighbors) {
      const nNormal = worldQuads[ni]!.normal;
      const nLen = len(nNormal);
      const qLen = len(normal);
      if (nLen === 0 || qLen === 0) continue;
      const cosAngle = dot(normal, nNormal) / (qLen * nLen);
      const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      if (angle > maxAngle) maxAngle = angle;
    }

    // Fold: normals differ by > ~15°
    if (maxAngle > 0.26) {
      classes.push("fold");
    } else {
      classes.push("detail");
    }
  }

  return classes as [EdgeClass, EdgeClass, EdgeClass, EdgeClass];
}

// ---------------------------------------------------------------------------
// Screen normal angle
// ---------------------------------------------------------------------------

/**
 * Compute the screen-space angle of a projected surface normal.
 * Returns radians where 0 = rightward, π/2 = upward.
 *
 * Projects a point offset along the world normal and measures the
 * 2D direction from the quad center to the offset point.
 */
export function computeScreenNormalAngle(
  worldNormal: Vec3,
  screenQuad: ScreenQuad,
  worldCenter: Vec3,
  camera: Camera,
  viewport: Viewport,
  vpMatrix: Float64Array,
): number {
  // Default fallback: 45° diagonal
  const nLen = len(worldNormal);
  if (nLen === 0) return Math.PI / 4;

  // We can't easily re-project without importing projectWithMatrix here,
  // so use a simplified approach: project the normal direction using the
  // camera's view matrix orientation.
  //
  // For a perspective camera looking at -Z (standard), the screen X maps
  // roughly to world X and screen Y maps to world Y (inverted).
  // This is approximate but sufficient for hatching direction.
  const nx = worldNormal.x / nLen;
  const ny = worldNormal.y / nLen;
  const nz = worldNormal.z / nLen;

  // Screen-space direction of the normal (camera-relative)
  // Assuming camera looks roughly along -Z with Y up:
  // screen-x ≈ world-x component of normal
  // screen-y ≈ -world-y component of normal (canvas Y is inverted)
  // We ignore Z since it's the depth component
  const sx = nx;
  const sy = -ny;

  return Math.atan2(sy, sx);
}

// ---------------------------------------------------------------------------
// Classify all quads for a building
// ---------------------------------------------------------------------------

/**
 * Take projected ScreenQuads and their source WorldQuads, classify edges,
 * and return ClassifiedScreenQuads.
 */
export function classifyProjectedQuads(
  worldQuads: WorldQuad[],
  screenQuads: ScreenQuad[],
  camera: Camera,
  viewport: Viewport,
  vpMatrix: Float64Array,
): ClassifiedScreenQuad[] {
  // Build visibility mask
  const visibleMask = screenQuads.map((sq) => sq.visible);

  // Build adjacency from ALL world quads (not just visible — adjacency
  // is a geometric property)
  const adjacency = buildEdgeAdjacency(worldQuads);

  const result: ClassifiedScreenQuad[] = [];

  for (let i = 0; i < screenQuads.length; i++) {
    const sq = screenQuads[i]!;

    if (!sq.visible) {
      result.push({
        ...sq,
        edgeClasses: ["fold", "fold", "fold", "fold"],
        screenNormalAngle: 0,
      });
      continue;
    }

    const edgeClasses = classifyQuadEdges(i, worldQuads, visibleMask, adjacency);

    // Compute world center for normal projection
    const wq = worldQuads[i]!;
    const cx = (wq.corners[0].x + wq.corners[1].x + wq.corners[2].x + wq.corners[3].x) / 4;
    const cy = (wq.corners[0].y + wq.corners[1].y + wq.corners[2].y + wq.corners[3].y) / 4;
    const cz = (wq.corners[0].z + wq.corners[1].z + wq.corners[2].z + wq.corners[3].z) / 4;

    const screenNormalAngle = computeScreenNormalAngle(
      wq.normal, sq, { x: cx, y: cy, z: cz }, camera, viewport, vpMatrix,
    );

    result.push({
      ...sq,
      edgeClasses,
      screenNormalAngle,
    });
  }

  return result;
}
