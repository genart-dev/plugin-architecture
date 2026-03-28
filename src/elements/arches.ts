import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

/** Number of segments for arch curve approximation. */
const ARCH_SEGMENTS = 12;

/**
 * Build an arch as a series of quads along the arch curve.
 * The arch spans the element width, with the curve occupying
 * the top portion of the element height.
 */
function makeArchQuads(
  cx: number,
  cy: number,
  cz: number,
  width: number,
  height: number,
  archDepth: number,
  rotation: number,
  curveFunc: (t: number) => number, // t: 0-1 across span → y offset from springing line
  archThickness: number,
): WorldQuad[] {
  const quads: WorldQuad[] = [];
  const hw = width / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  });

  // Springing height (where arch curve begins) = total height - max arch rise
  const maxRise = curveFunc(0.5);
  const springH = height - maxRise;
  const halfD = archDepth / 2;

  // Arch curve quads (front face)
  for (let i = 0; i < ARCH_SEGMENTS; i++) {
    const t0 = i / ARCH_SEGMENTS;
    const t1 = (i + 1) / ARCH_SEGMENTS;

    const x0 = -hw + t0 * width;
    const x1 = -hw + t1 * width;
    const y0 = springH + curveFunc(t0);
    const y1 = springH + curveFunc(t1);
    const y0inner = springH + curveFunc(t0) - archThickness;
    const y1inner = springH + curveFunc(t1) - archThickness;

    // Front face of arch ring
    quads.push({
      corners: [
        rot(x0, y0inner, halfD),
        rot(x1, y1inner, halfD),
        rot(x1, y1, halfD),
        rot(x0, y0, halfD),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  // Left pier
  quads.push({
    corners: [
      rot(-hw, 0, halfD),
      rot(-hw + archThickness, 0, halfD),
      rot(-hw + archThickness, springH, halfD),
      rot(-hw, springH + curveFunc(0), halfD),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Right pier
  quads.push({
    corners: [
      rot(hw - archThickness, 0, halfD),
      rot(hw, 0, halfD),
      rot(hw, springH + curveFunc(1), halfD),
      rot(hw - archThickness, springH, halfD),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  return quads;
}

function drawArch(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuad(ctx, sq, style);
  }
}

// ---------------------------------------------------------------------------
// Curve functions for different arch types
// ---------------------------------------------------------------------------

/** Semicircular (Roman) arch. */
function roundCurve(span: number): (t: number) => number {
  const r = span / 2;
  return (t) => {
    const x = (t - 0.5) * span;
    const val = r * r - x * x;
    return val > 0 ? Math.sqrt(val) : 0;
  };
}

/** Pointed (Gothic) arch — two arcs meeting at a point. */
function pointedCurve(span: number, peakRatio: number): (t: number) => number {
  const r = span * peakRatio;
  return (t) => {
    if (t <= 0.5) {
      const x = t * span;
      const val = r * r - (x - r) * (x - r);
      return val > 0 ? Math.sqrt(val) : 0;
    }
    const x = (1 - t) * span;
    const val = r * r - (x - r) * (x - r);
    return val > 0 ? Math.sqrt(val) : 0;
  };
}

/** Horseshoe (Islamic) arch — wider than semicircle. */
function horseshoeCurve(span: number): (t: number) => number {
  const r = span * 0.55;
  return (t) => {
    const angle = Math.PI * (1 - t);
    const y = Math.sin(angle) * r;
    return y > 0 ? y : 0;
  };
}

/** Ogee arch — S-curves meeting at a point. */
function ogeeCurve(span: number): (t: number) => number {
  const peak = span * 0.8;
  return (t) => {
    const s = t <= 0.5 ? t * 2 : (1 - t) * 2;
    // S-curve using cubic easing
    const eased = s < 0.5
      ? 4 * s * s * s
      : 1 - Math.pow(-2 * s + 2, 3) / 2;
    return eased * peak;
  };
}

/** Lancet arch — tall pointed arch. */
function lancetCurve(span: number): (t: number) => number {
  return pointedCurve(span, 1.2)(0) === 0
    ? pointedCurve(span, 1.2)
    : pointedCurve(span, 1.2);
}

/** Trefoil arch — three lobes. */
function trefoilCurve(span: number): (t: number) => number {
  const r = span / 3;
  return (t) => {
    const x = t * span;
    const seg = Math.floor(x / (span / 3));
    const localT = (x - seg * (span / 3)) / (span / 3);
    const localX = (localT - 0.5) * (span / 3);
    const val = r * r / 4 - localX * localX;
    return val > 0 ? Math.sqrt(val) + r * 0.3 : r * 0.3;
  };
}

/** Parabolic arch. */
function parabolicCurve(span: number): (t: number) => number {
  const peak = span * 0.7;
  return (t) => {
    const x = (t - 0.5) * 2; // -1 to 1
    return peak * (1 - x * x);
  };
}

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

function archRenderer(
  element: ElementInstance,
  curveFunc: (t: number) => number,
): ElementRenderResult {
  const { position, width, height, depth, rotation } = element;
  const thickness = Math.max(width * 0.12, 0.1);
  const quads = makeArchQuads(
    position.x, position.y, position.z,
    width, height, depth,
    rotation, curveFunc, thickness,
  );

  return {
    quads,
    draw: (ctx, projected, style) => drawArch(ctx, projected, style),
  };
}

registerElement("arch-round", (el) =>
  archRenderer(el, roundCurve(el.width)),
);
registerElement("arch-pointed", (el) =>
  archRenderer(el, pointedCurve(el.width, 0.8)),
);
registerElement("arch-horseshoe", (el) =>
  archRenderer(el, horseshoeCurve(el.width)),
);
registerElement("arch-ogee", (el) =>
  archRenderer(el, ogeeCurve(el.width)),
);
registerElement("arch-lancet", (el) =>
  archRenderer(el, lancetCurve(el.width)),
);
registerElement("arch-trefoil", (el) =>
  archRenderer(el, trefoilCurve(el.width)),
);
registerElement("arch-parabolic", (el) =>
  archRenderer(el, parabolicCurve(el.width)),
);
