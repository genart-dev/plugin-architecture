import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

/** Number of side facets for column rendering. */
const COLUMN_FACETS = 8;

/**
 * Build a column as a series of vertical quads approximating a cylinder.
 * Tapers from baseRadius to topRadius over the column height.
 */
function makeColumnQuads(
  cx: number,
  cy: number,
  cz: number,
  height: number,
  baseRadius: number,
  topRadius: number,
  rotY: number,
  facets: number,
): WorldQuad[] {
  const quads: WorldQuad[] = [];
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  });

  for (let i = 0; i < facets; i++) {
    const a0 = (i / facets) * Math.PI * 2;
    const a1 = ((i + 1) / facets) * Math.PI * 2;

    const bx0 = Math.cos(a0) * baseRadius;
    const bz0 = Math.sin(a0) * baseRadius;
    const bx1 = Math.cos(a1) * baseRadius;
    const bz1 = Math.sin(a1) * baseRadius;

    const tx0 = Math.cos(a0) * topRadius;
    const tz0 = Math.sin(a0) * topRadius;
    const tx1 = Math.cos(a1) * topRadius;
    const tz1 = Math.sin(a1) * topRadius;

    const midA = (a0 + a1) / 2;
    const normal: Vec3 = {
      x: Math.cos(midA) * cosR + Math.sin(midA) * sinR,
      y: 0,
      z: -Math.cos(midA) * sinR + Math.sin(midA) * cosR,
    };

    quads.push({
      corners: [
        rot(bx0, 0, bz0),
        rot(bx1, 0, bz1),
        rot(tx1, height, tz1),
        rot(tx0, height, tz0),
      ],
      normal,
    });
  }

  return quads;
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
  hasFluting: boolean,
): void {
  // Draw visible facets back-to-front (they're already depth-sorted by caller)
  for (const sq of projected) {
    drawQuad(ctx, sq, style);
  }

  // Fluting lines (vertical grooves) at higher detail levels
  if (hasFluting && style.detail > 0.4) {
    ctx.globalAlpha = style.opacity * 0.2;
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = Math.max(0.3, style.strokeWeight * 0.3);

    for (const sq of projected) {
      if (!sq.visible) continue;
      const midX = (sq.corners[0].x + sq.corners[1].x) / 2;
      const topMidX = (sq.corners[2].x + sq.corners[3].x) / 2;
      const botY = (sq.corners[0].y + sq.corners[1].y) / 2;
      const topY = (sq.corners[2].y + sq.corners[3].y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, botY);
      ctx.lineTo(topMidX, topY);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Column renderers
// ---------------------------------------------------------------------------

function columnRenderer(
  element: ElementInstance,
  taperRatio: number,
  hasFluting: boolean,
  hasCapital: boolean,
): ElementRenderResult {
  const { position, width, height, rotation } = element;
  const baseR = width / 2;
  const topR = baseR * taperRatio;

  // Main shaft
  const quads = makeColumnQuads(
    position.x,
    position.y,
    position.z,
    height * (hasCapital ? 0.85 : 1),
    baseR,
    topR,
    rotation,
    COLUMN_FACETS,
  );

  // Capital (simplified as a wider section at top)
  if (hasCapital) {
    const capH = height * 0.15;
    const capBase = position.y + height * 0.85;
    const capQuads = makeColumnQuads(
      position.x,
      capBase,
      position.z,
      capH,
      topR * 1.3,
      topR * 1.5,
      rotation,
      COLUMN_FACETS,
    );
    quads.push(...capQuads);
  }

  return {
    quads,
    draw: (ctx, projected, style) => drawColumn(ctx, projected, style, hasFluting),
  };
}

registerElement("column-doric", (el) => columnRenderer(el, 0.8, true, true));
registerElement("column-ionic", (el) => columnRenderer(el, 0.85, true, true));
registerElement("column-corinthian", (el) => columnRenderer(el, 0.85, true, true));
registerElement("column-simple", (el) => columnRenderer(el, 1.0, false, false));
registerElement("pilaster", (el) => {
  // Pilaster = flat column against a wall (half-depth box)
  const { position, width, height, depth, rotation } = el;
  const quads: WorldQuad[] = [];
  const hw = width / 2;
  const hd = Math.max(depth * 0.15, 0.05);
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  // Front face only (pilaster projects from wall)
  quads.push({
    corners: [
      rot(-hw, 0, hd),
      rot(hw, 0, hd),
      rot(hw, height, hd),
      rot(-hw, height, hd),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Side faces
  quads.push({
    corners: [
      rot(-hw, 0, 0),
      rot(-hw, 0, hd),
      rot(-hw, height, hd),
      rot(-hw, height, 0),
    ],
    normal: { x: -cosR, y: 0, z: sinR },
  });
  quads.push({
    corners: [
      rot(hw, 0, hd),
      rot(hw, 0, 0),
      rot(hw, height, 0),
      rot(hw, height, hd),
    ],
    normal: { x: cosR, y: 0, z: -sinR },
  });

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});
