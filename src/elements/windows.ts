import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

/**
 * Build a window as a recessed opening on a front-facing quad.
 * Windows are flat elements (no depth) rendered as openings in walls.
 */
function makeWindowQuads(
  cx: number,
  cy: number,
  cz: number,
  width: number,
  height: number,
  rotation: number,
  mullions: number,
  hasArch: boolean,
  archType: "round" | "pointed" | "flat",
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

  const frameW = width * 0.08;
  const recess = 0.05; // Slight recess for depth illusion

  // Outer frame (surround)
  quads.push({
    corners: [
      rot(-hw, 0, recess),
      rot(hw, 0, recess),
      rot(hw, height, recess),
      rot(-hw, height, recess),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Glass/opening (darker, slightly recessed)
  quads.push({
    corners: [
      rot(-hw + frameW, frameW, 0),
      rot(hw - frameW, frameW, 0),
      rot(hw - frameW, height - frameW, 0),
      rot(-hw + frameW, height - frameW, 0),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Mullion bars (vertical dividers)
  if (mullions > 0) {
    const innerW = width - frameW * 2;
    for (let m = 1; m <= mullions; m++) {
      const t = m / (mullions + 1);
      const mx = -hw + frameW + t * innerW;
      const barW = frameW * 0.4;

      quads.push({
        corners: [
          rot(mx - barW / 2, frameW, recess * 0.5),
          rot(mx + barW / 2, frameW, recess * 0.5),
          rot(mx + barW / 2, height - frameW, recess * 0.5),
          rot(mx - barW / 2, height - frameW, recess * 0.5),
        ],
        normal: { x: sinR, y: 0, z: cosR },
      });
    }
  }

  // Horizontal transom bar (if arched or multi-part)
  if (hasArch) {
    const transomY = height * 0.65;
    quads.push({
      corners: [
        rot(-hw + frameW, transomY - frameW * 0.3, recess * 0.5),
        rot(hw - frameW, transomY - frameW * 0.3, recess * 0.5),
        rot(hw - frameW, transomY + frameW * 0.3, recess * 0.5),
        rot(-hw + frameW, transomY + frameW * 0.3, recess * 0.5),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return quads;
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  if (projected.length === 0) return;

  // First quad = frame surround, second = glass pane, rest = mullions/transoms
  for (let i = 0; i < projected.length; i++) {
    const sq = projected[i]!;
    if (!sq.visible) continue;

    if (i === 0) {
      // Frame surround — slightly lighter than wall, thicker stroke
      const frameStyle: RenderStyle = {
        ...style,
        strokeWeight: style.strokeWeight * 1.2,
        opacity: Math.min(1, style.opacity * 1.1),
      };
      drawQuad(ctx, sq, frameStyle);
    } else if (i === 1) {
      // Glass pane — very dark fill, full opacity for contrast
      const glassStyle: RenderStyle = {
        ...style,
        fillColor: "#0e0e1a",
        strokeWeight: style.strokeWeight * 0.8,
        opacity: Math.min(1, style.opacity + 0.2),
      };
      drawQuad(ctx, sq, glassStyle);
    } else {
      // Mullion bars — thicker for visibility
      const mullionStyle: RenderStyle = {
        ...style,
        strokeWeight: style.strokeWeight * 0.7,
        opacity: Math.min(1, style.opacity + 0.1),
      };
      drawQuad(ctx, sq, mullionStyle);
    }
  }
}

// ---------------------------------------------------------------------------
// Window type registrations
// ---------------------------------------------------------------------------

registerElement("window-single", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation,
    0, false, "flat",
  );
  return { quads, draw: drawWindow };
});

registerElement("window-paired", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation,
    1, false, "flat",
  );
  return { quads, draw: drawWindow };
});

registerElement("window-arched", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation,
    0, true, "round",
  );
  return { quads, draw: drawWindow };
});

registerElement("window-rose", (el) => {
  // Rose window — circular, rendered as an octagonal frame
  const { position, width, height, rotation } = el;
  const r = Math.min(width, height) / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  // Approximate circle with octagon
  const quads: WorldQuad[] = [];
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const ir = r * 0.7; // Inner radius

    quads.push({
      corners: [
        rot(Math.cos(a0) * ir, height / 2 + Math.sin(a0) * ir, 0),
        rot(Math.cos(a1) * ir, height / 2 + Math.sin(a1) * ir, 0),
        rot(Math.cos(a1) * r, height / 2 + Math.sin(a1) * r, 0.02),
        rot(Math.cos(a0) * r, height / 2 + Math.sin(a0) * r, 0.02),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("window-lancet", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation,
    0, true, "pointed",
  );
  return { quads, draw: drawWindow };
});

registerElement("window-dormer", (el) => {
  // Dormer — window with small roof above
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height * 0.75, el.rotation,
    0, false, "flat",
  );

  // Small gable roof above
  const hw = el.width / 2;
  const roofH = el.height * 0.25;
  const baseY = el.position.y + el.height * 0.75;
  const cosR = Math.cos(el.rotation);
  const sinR = Math.sin(el.rotation);
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: el.position.x + lx * cosR + lz * sinR,
    y: baseY + ly,
    z: el.position.z - lx * sinR + lz * cosR,
  });

  quads.push({
    corners: [
      rot(-hw, 0, 0.02),
      rot(hw, 0, 0.02),
      rot(0, roofH, 0.02),
      rot(0, roofH, 0.02), // degenerate triangle as quad
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  return { quads, draw: drawWindow };
});

registerElement("window-ribbon", (el) => {
  // Ribbon window — wide horizontal, multiple mullions
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation,
    3, false, "flat",
  );
  return { quads, draw: drawWindow };
});

registerElement("window-oculus", (el) => {
  // Oculus — small circular window (reuse rose window logic at smaller scale)
  const { position, width, height, rotation } = el;
  const r = Math.min(width, height) / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  const quads: WorldQuad[] = [];
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const ir = r * 0.75;

    quads.push({
      corners: [
        rot(Math.cos(a0) * ir, height / 2 + Math.sin(a0) * ir, 0),
        rot(Math.cos(a1) * ir, height / 2 + Math.sin(a1) * ir, 0),
        rot(Math.cos(a1) * r, height / 2 + Math.sin(a1) * r, 0.02),
        rot(Math.cos(a0) * r, height / 2 + Math.sin(a0) * r, 0.02),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});
