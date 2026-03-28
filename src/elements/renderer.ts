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

/** Draw a projected quad as a filled and stroked polygon. */
export function drawQuad(
  ctx: CanvasRenderingContext2D,
  quad: ScreenQuad,
  style: RenderStyle,
): void {
  if (!quad.visible) return;

  ctx.beginPath();
  ctx.moveTo(quad.corners[0].x, quad.corners[0].y);
  ctx.lineTo(quad.corners[1].x, quad.corners[1].y);
  ctx.lineTo(quad.corners[2].x, quad.corners[2].y);
  ctx.lineTo(quad.corners[3].x, quad.corners[3].y);
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

/** Draw a projected quad with hatching (detail-dependent line count). */
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

  const cos = Math.cos(hatchAngle);
  const sin = Math.sin(hatchAngle);

  for (let i = 1; i < lines; i++) {
    const t = i / lines;
    // Interpolate along left and right edges
    const lx = quad.corners[0].x + (quad.corners[3].x - quad.corners[0].x) * t;
    const ly = quad.corners[0].y + (quad.corners[3].y - quad.corners[0].y) * t;
    const rx = quad.corners[1].x + (quad.corners[2].x - quad.corners[1].x) * t;
    const ry = quad.corners[1].y + (quad.corners[2].y - quad.corners[1].y) * t;

    ctx.beginPath();
    ctx.moveTo(lx + cos * 0.5, ly + sin * 0.5);
    ctx.lineTo(rx - cos * 0.5, ry - sin * 0.5);
    ctx.stroke();
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
