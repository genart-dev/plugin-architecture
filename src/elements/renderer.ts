import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  ElementType,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";

// ---------------------------------------------------------------------------
// Element Renderer Registry
// ---------------------------------------------------------------------------

/** Function signature for rendering a single construction element. */
export type ElementRenderer = (
  element: ElementInstance,
  rand: () => number,
) => ElementRenderResult;

const registry = new Map<ElementType, ElementRenderer>();

/** Register a renderer for an element type. */
export function registerElement(type: ElementType, renderer: ElementRenderer): void {
  registry.set(type, renderer);
}

/** Get the renderer for an element type. Falls back to a box renderer. */
export function getElementRenderer(type: ElementType): ElementRenderer {
  return registry.get(type) ?? fallbackRenderer;
}

/** List all registered element types. */
export function listRegisteredElements(): ElementType[] {
  return [...registry.keys()];
}

// ---------------------------------------------------------------------------
// Geometry helpers for element renderers
// ---------------------------------------------------------------------------

/** Build a box (6 quads) in world space around a position. */
export function makeBox(
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  rotY: number,
): WorldQuad[] {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;

  // Rotation around Y axis
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cos + lz * sin,
    y: cy + ly,
    z: cz - lx * sin + lz * cos,
  });

  // Front face (+Z local)
  const front: WorldQuad = {
    corners: [
      rot(-hw, -hh, hd),
      rot(hw, -hh, hd),
      rot(hw, hh, hd),
      rot(-hw, hh, hd),
    ],
    normal: { x: sin, y: 0, z: cos },
  };

  // Back face (-Z local)
  const back: WorldQuad = {
    corners: [
      rot(hw, -hh, -hd),
      rot(-hw, -hh, -hd),
      rot(-hw, hh, -hd),
      rot(hw, hh, -hd),
    ],
    normal: { x: -sin, y: 0, z: -cos },
  };

  // Left face (-X local)
  const left: WorldQuad = {
    corners: [
      rot(-hw, -hh, -hd),
      rot(-hw, -hh, hd),
      rot(-hw, hh, hd),
      rot(-hw, hh, -hd),
    ],
    normal: { x: -cos, y: 0, z: sin },
  };

  // Right face (+X local)
  const right: WorldQuad = {
    corners: [
      rot(hw, -hh, hd),
      rot(hw, -hh, -hd),
      rot(hw, hh, -hd),
      rot(hw, hh, hd),
    ],
    normal: { x: cos, y: 0, z: -sin },
  };

  // Top face (+Y)
  const top: WorldQuad = {
    corners: [
      rot(-hw, hh, hd),
      rot(hw, hh, hd),
      rot(hw, hh, -hd),
      rot(-hw, hh, -hd),
    ],
    normal: { x: 0, y: 1, z: 0 },
  };

  // Bottom face (-Y)
  const bottom: WorldQuad = {
    corners: [
      rot(-hw, -hh, -hd),
      rot(hw, -hh, -hd),
      rot(hw, -hh, hd),
      rot(-hw, -hh, hd),
    ],
    normal: { x: 0, y: -1, z: 0 },
  };

  return [front, back, left, right, top, bottom];
}

/** Check if two screen points are effectively the same (degenerate edge). */
function samePoint(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;
}

/** Draw a projected quad as a filled and stroked polygon.
 *  Handles degenerate quads (triangles) where two corners collapse to one point. */
export function drawQuad(
  ctx: CanvasRenderingContext2D,
  quad: ScreenQuad,
  style: RenderStyle,
): void {
  if (!quad.visible) return;

  // Collect unique corners — degenerate quads (two corners same) become triangles
  const c = quad.corners;
  const pts: { x: number; y: number }[] = [c[0]];
  if (!samePoint(c[1], c[0])) pts.push(c[1]);
  if (!samePoint(c[2], pts[pts.length - 1]!)) pts.push(c[2]);
  if (!samePoint(c[3], pts[pts.length - 1]!) && !samePoint(c[3], pts[0]!)) pts.push(c[3]);

  if (pts.length < 3) return; // degenerate line or point — skip

  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i]!.x, pts[i]!.y);
  }
  ctx.closePath();

  if (!style.wireframe) {
    ctx.globalAlpha = style.opacity;
    ctx.fillStyle = style.fillColor;
    ctx.fill();
  }

  ctx.globalAlpha = style.opacity;
  ctx.strokeStyle = style.strokeColor;
  ctx.lineWidth = style.strokeWeight;
  ctx.stroke();
}

/** Draw a projected quad with hatching (detail-dependent line count).
 *  Handles degenerate quads (triangles) by clipping hatch to the shape. */
export function drawQuadWithHatching(
  ctx: CanvasRenderingContext2D,
  quad: ScreenQuad,
  style: RenderStyle,
  hatchAngle: number,
  hatchDensity: number,
): void {
  drawQuad(ctx, quad, style);
  if (style.wireframe || style.detail < 0.3) return;

  const lines = Math.floor(hatchDensity * style.detail * quad.scale * 0.02);
  if (lines < 2) return;

  ctx.globalAlpha = style.opacity * 0.3;
  ctx.strokeStyle = style.strokeColor;
  ctx.lineWidth = Math.max(0.5, style.strokeWeight * 0.4);

  // Detect degenerate quad (triangle): if corners 2 and 3 are the same
  const c = quad.corners;
  const isTriangle = samePoint(c[2], c[3]);

  if (isTriangle) {
    // Triangle hatching: interpolate from base (c0→c1) toward apex (c2)
    for (let i = 1; i < lines; i++) {
      const t = i / lines;
      // Left edge: c0 → c2 (apex)
      const lx = c[0].x + (c[2].x - c[0].x) * t;
      const ly = c[0].y + (c[2].y - c[0].y) * t;
      // Right edge: c1 → c2 (apex)
      const rx = c[1].x + (c[2].x - c[1].x) * t;
      const ry = c[1].y + (c[2].y - c[1].y) * t;

      // Skip near-zero-length lines at apex
      const dx = rx - lx, dy = ry - ly;
      if (dx * dx + dy * dy < 4) continue;

      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
  } else {
    // Quad hatching: interpolate along left (c0→c3) and right (c1→c2) edges
    for (let i = 1; i < lines; i++) {
      const t = i / lines;
      const lx = c[0].x + (c[3].x - c[0].x) * t;
      const ly = c[0].y + (c[3].y - c[0].y) * t;
      const rx = c[1].x + (c[2].x - c[1].x) * t;
      const ry = c[1].y + (c[2].y - c[1].y) * t;

      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Fallback renderer (plain box)
// ---------------------------------------------------------------------------

const fallbackRenderer: ElementRenderer = (element) => {
  const { position, width, height, depth, rotation } = element;
  const quads = makeBox(
    position.x,
    position.y + height / 2,
    position.z,
    width,
    height,
    depth,
    rotation,
  );

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        drawQuad(ctx, sq, style);
      }
    },
  };
};
