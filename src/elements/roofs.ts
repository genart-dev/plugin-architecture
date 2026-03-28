import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, drawQuadWithHatching, registerElement } from "./renderer.js";

function drawRoof(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuadWithHatching(ctx, sq, style, Math.PI * 0.25, 8);
  }
}

// ---------------------------------------------------------------------------
// Roof geometry helpers
// ---------------------------------------------------------------------------

function rotPoint(
  cx: number, cy: number, cz: number,
  lx: number, ly: number, lz: number,
  cosR: number, sinR: number,
): Vec3 {
  return {
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  };
}

// ---------------------------------------------------------------------------
// Gable roof — two sloped planes meeting at a ridge
// ---------------------------------------------------------------------------

registerElement("roof-gable", (el) => {
  const { position, width, height, depth, rotation } = el;
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [
    // Left slope
    {
      corners: [
        r(-hw, 0, -hd),
        r(-hw, 0, hd),
        r(0, height, hd),
        r(0, height, -hd),
      ],
      normal: { x: -height * cosR, y: hw, z: -height * sinR },
    },
    // Right slope
    {
      corners: [
        r(hw, 0, hd),
        r(hw, 0, -hd),
        r(0, height, -hd),
        r(0, height, hd),
      ],
      normal: { x: height * cosR, y: hw, z: height * sinR },
    },
    // Front gable triangle (as quad with degenerate top)
    {
      corners: [
        r(-hw, 0, hd),
        r(hw, 0, hd),
        r(0, height, hd),
        r(0, height, hd),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    },
    // Back gable triangle
    {
      corners: [
        r(hw, 0, -hd),
        r(-hw, 0, -hd),
        r(0, height, -hd),
        r(0, height, -hd),
      ],
      normal: { x: -sinR, y: 0, z: -cosR },
    },
  ];

  return { quads, draw: drawRoof };
});

// ---------------------------------------------------------------------------
// Hip roof — four sloped planes
// ---------------------------------------------------------------------------

registerElement("roof-hip", (el) => {
  const { position, width, height, depth, rotation } = el;
  const hw = width / 2;
  const hd = depth / 2;
  const ridgeLen = Math.max(0, depth - width) / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [
    // Front slope
    {
      corners: [
        r(-hw, 0, hd),
        r(hw, 0, hd),
        r(0, height, ridgeLen),
        r(0, height, ridgeLen), // degenerate triangle when ridgeLen=0
      ],
      normal: { x: 0, y: hd, z: height },
    },
    // Back slope
    {
      corners: [
        r(hw, 0, -hd),
        r(-hw, 0, -hd),
        r(0, height, -ridgeLen),
        r(0, height, -ridgeLen),
      ],
      normal: { x: 0, y: hd, z: -height },
    },
    // Left slope
    {
      corners: [
        r(-hw, 0, -hd),
        r(-hw, 0, hd),
        r(0, height, ridgeLen),
        r(0, height, -ridgeLen),
      ],
      normal: { x: -height, y: hw, z: 0 },
    },
    // Right slope
    {
      corners: [
        r(hw, 0, hd),
        r(hw, 0, -hd),
        r(0, height, -ridgeLen),
        r(0, height, ridgeLen),
      ],
      normal: { x: height, y: hw, z: 0 },
    },
  ];

  return { quads, draw: drawRoof };
});

// ---------------------------------------------------------------------------
// Mansard roof — steep lower slopes + shallow upper slopes
// ---------------------------------------------------------------------------

registerElement("roof-mansard", (el) => {
  const { position, width, height, depth, rotation } = el;
  const hw = width / 2;
  const hd = depth / 2;
  const breakH = height * 0.6;
  const upperInset = hw * 0.25;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  // Upper section meets at a flat rectangle, not a point
  const topInset = upperInset * 1.8;
  const topH = height;

  const quads: WorldQuad[] = [
    // Lower front (steep)
    {
      corners: [
        r(-hw, 0, hd),
        r(hw, 0, hd),
        r(hw - upperInset, breakH, hd - upperInset),
        r(-hw + upperInset, breakH, hd - upperInset),
      ],
      normal: { x: 0, y: 0.3, z: 1 },
    },
    // Lower left (steep)
    {
      corners: [
        r(-hw, 0, -hd),
        r(-hw, 0, hd),
        r(-hw + upperInset, breakH, hd - upperInset),
        r(-hw + upperInset, breakH, -hd + upperInset),
      ],
      normal: { x: -1, y: 0.3, z: 0 },
    },
    // Lower right (steep)
    {
      corners: [
        r(hw, 0, hd),
        r(hw, 0, -hd),
        r(hw - upperInset, breakH, -hd + upperInset),
        r(hw - upperInset, breakH, hd - upperInset),
      ],
      normal: { x: 1, y: 0.3, z: 0 },
    },
    // Lower back (steep)
    {
      corners: [
        r(hw, 0, -hd),
        r(-hw, 0, -hd),
        r(-hw + upperInset, breakH, -hd + upperInset),
        r(hw - upperInset, breakH, -hd + upperInset),
      ],
      normal: { x: 0, y: 0.3, z: -1 },
    },
    // Upper front (shallow slope to flat top)
    {
      corners: [
        r(-hw + upperInset, breakH, hd - upperInset),
        r(hw - upperInset, breakH, hd - upperInset),
        r(hw - topInset, topH, hd - topInset),
        r(-hw + topInset, topH, hd - topInset),
      ],
      normal: { x: 0, y: 1, z: 0.3 },
    },
    // Upper back (shallow)
    {
      corners: [
        r(hw - upperInset, breakH, -hd + upperInset),
        r(-hw + upperInset, breakH, -hd + upperInset),
        r(-hw + topInset, topH, -hd + topInset),
        r(hw - topInset, topH, -hd + topInset),
      ],
      normal: { x: 0, y: 1, z: -0.3 },
    },
    // Upper left (shallow)
    {
      corners: [
        r(-hw + upperInset, breakH, -hd + upperInset),
        r(-hw + upperInset, breakH, hd - upperInset),
        r(-hw + topInset, topH, hd - topInset),
        r(-hw + topInset, topH, -hd + topInset),
      ],
      normal: { x: -0.3, y: 1, z: 0 },
    },
    // Upper right (shallow)
    {
      corners: [
        r(hw - upperInset, breakH, hd - upperInset),
        r(hw - upperInset, breakH, -hd + upperInset),
        r(hw - topInset, topH, -hd + topInset),
        r(hw - topInset, topH, hd - topInset),
      ],
      normal: { x: 0.3, y: 1, z: 0 },
    },
    // Flat top
    {
      corners: [
        r(-hw + topInset, topH, hd - topInset),
        r(hw - topInset, topH, hd - topInset),
        r(hw - topInset, topH, -hd + topInset),
        r(-hw + topInset, topH, -hd + topInset),
      ],
      normal: { x: 0, y: 1, z: 0 },
    },
  ];

  return { quads, draw: drawRoof };
});

// ---------------------------------------------------------------------------
// Dome — hemisphere approximated by quads
// ---------------------------------------------------------------------------

registerElement("roof-dome", (el) => {
  const { position, width, height, rotation } = el;
  const rx = width / 2;
  const ry = height;
  const rz = width / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [];
  const rings = 4;
  const segs = 8;

  for (let ring = 0; ring < rings; ring++) {
    const phi0 = (ring / rings) * (Math.PI / 2);
    const phi1 = ((ring + 1) / rings) * (Math.PI / 2);

    for (let seg = 0; seg < segs; seg++) {
      const theta0 = (seg / segs) * Math.PI * 2;
      const theta1 = ((seg + 1) / segs) * Math.PI * 2;

      const p = (phi: number, theta: number): Vec3 =>
        r(
          rx * Math.cos(phi) * Math.cos(theta),
          ry * Math.sin(phi),
          rz * Math.cos(phi) * Math.sin(theta),
        );

      const midPhi = (phi0 + phi1) / 2;
      const midTheta = (theta0 + theta1) / 2;

      quads.push({
        corners: [
          p(phi0, theta0),
          p(phi0, theta1),
          p(phi1, theta1),
          p(phi1, theta0),
        ],
        normal: {
          x: Math.cos(midPhi) * Math.cos(midTheta),
          y: Math.sin(midPhi),
          z: Math.cos(midPhi) * Math.sin(midTheta),
        },
      });
    }
  }

  return { quads, draw: drawRoof };
});

// ---------------------------------------------------------------------------
// Flat roof (modern)
// ---------------------------------------------------------------------------

registerElement("roof-flat", (el) => {
  const { position, width, depth, rotation } = el;
  const hw = width / 2;
  const hd = depth / 2;
  const h = 0.15; // Minimal parapet height
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [
    // Top surface
    {
      corners: [
        r(-hw, h, hd),
        r(hw, h, hd),
        r(hw, h, -hd),
        r(-hw, h, -hd),
      ],
      normal: { x: 0, y: 1, z: 0 },
    },
    // Front parapet
    {
      corners: [
        r(-hw, 0, hd),
        r(hw, 0, hd),
        r(hw, h, hd),
        r(-hw, h, hd),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    },
  ];

  return { quads, draw: drawRoof };
});

// Barrel vault, pagoda, onion, spire, tensile use the fallback renderer
// (registered in renderer.ts) until detailed geometry is implemented.
// They'll be enhanced in subsequent phases.

registerElement("roof-barrel-vault", (el) => {
  const { position, width, height, depth, rotation } = el;
  const hw = width / 2;
  const hd = depth / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [];
  const segs = 8;

  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI;
    const a1 = ((i + 1) / segs) * Math.PI;

    quads.push({
      corners: [
        r(-hw + Math.cos(a0) * hw + hw, Math.sin(a0) * height, -hd),
        r(-hw + Math.cos(a0) * hw + hw, Math.sin(a0) * height, hd),
        r(-hw + Math.cos(a1) * hw + hw, Math.sin(a1) * height, hd),
        r(-hw + Math.cos(a1) * hw + hw, Math.sin(a1) * height, -hd),
      ],
      normal: {
        x: Math.cos((a0 + a1) / 2),
        y: Math.sin((a0 + a1) / 2),
        z: 0,
      },
    });
  }

  return { quads, draw: drawRoof };
});

registerElement("roof-spire", (el) => {
  const { position, width, height, rotation } = el;
  const hw = width / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const r = (lx: number, ly: number, lz: number) =>
    rotPoint(position.x, position.y, position.z, lx, ly, lz, cosR, sinR);

  const quads: WorldQuad[] = [];
  const sides = 4;

  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;

    quads.push({
      corners: [
        r(Math.cos(a0) * hw, 0, Math.sin(a0) * hw),
        r(Math.cos(a1) * hw, 0, Math.sin(a1) * hw),
        r(0, height, 0),
        r(0, height, 0),
      ],
      normal: {
        x: Math.cos((a0 + a1) / 2),
        y: 0.5,
        z: Math.sin((a0 + a1) / 2),
      },
    });
  }

  return { quads, draw: drawRoof };
});
