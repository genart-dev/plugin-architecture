import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

// ---------------------------------------------------------------------------
// Recessed window geometry (Phase 3: window voids)
//
// A window is a void cut into a wall. The geometry:
// 1. Glass pane — recessed 80% of wall depth behind the front face. Near-black.
// 2. 4 reveal quads — perpendicular to wall, forming the recess sides.
// 3. Frame surround — at wall front face, slightly wider than opening.
// 4. Sill — thin shelf at bottom of opening, projecting slightly forward.
// 5. Mullion bars — vertical/horizontal dividers in front of glass.
// ---------------------------------------------------------------------------

/**
 * Build recessed window geometry.
 *
 * The window element position is at the wall CENTER (not front face).
 * `depth` is the full wall thickness. The glass sits at 80% recess
 * behind the front face, and the frame sits at the front face.
 */
function makeWindowQuads(
  cx: number,
  cy: number,
  cz: number,
  width: number,
  height: number,
  wallDepth: number,
  rotation: number,
  mullions: number,
  hasArch: boolean,
): WorldQuad[] {
  const quads: WorldQuad[] = [];
  const hw = width / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  // Wall half-depth — front face is at +halfD, back at -halfD (in local Z)
  const halfD = wallDepth / 2;
  // Glass recess: 80% of wall depth behind front face
  const glassZ = halfD - wallDepth * 0.8;
  // Frame sits at front face
  const frameZ = halfD;
  // Sill projects slightly forward of front face
  const sillZ = halfD + 0.02;

  const frameW = width * 0.08;

  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  });

  // Wall normal (outward direction)
  const wallNormal: Vec3 = { x: sinR, y: 0, z: cosR };

  // --- Quad 0: Frame surround at front face ---
  quads.push({
    corners: [
      rot(-hw - frameW * 0.3, -frameW * 0.3, frameZ + 0.01),
      rot(hw + frameW * 0.3, -frameW * 0.3, frameZ + 0.01),
      rot(hw + frameW * 0.3, height + frameW * 0.3, frameZ + 0.01),
      rot(-hw - frameW * 0.3, height + frameW * 0.3, frameZ + 0.01),
    ],
    normal: wallNormal,
  });

  // --- Quad 1: Glass pane (recessed, near-black void) ---
  quads.push({
    corners: [
      rot(-hw + frameW, frameW, glassZ),
      rot(hw - frameW, frameW, glassZ),
      rot(hw - frameW, height - frameW, glassZ),
      rot(-hw + frameW, height - frameW, glassZ),
    ],
    normal: wallNormal,
  });

  // --- Quads 2-5: Reveal quads (4 sides of the recess) ---
  // These connect the opening edges at the front face to the glass edges at glassZ.
  // They are perpendicular to the wall face.

  // Top reveal
  quads.push({
    corners: [
      rot(-hw + frameW, height - frameW, frameZ),
      rot(hw - frameW, height - frameW, frameZ),
      rot(hw - frameW, height - frameW, glassZ),
      rot(-hw + frameW, height - frameW, glassZ),
    ],
    normal: { x: 0, y: -1, z: 0 }, // facing down into the reveal
  });

  // Bottom reveal
  quads.push({
    corners: [
      rot(-hw + frameW, frameW, glassZ),
      rot(hw - frameW, frameW, glassZ),
      rot(hw - frameW, frameW, frameZ),
      rot(-hw + frameW, frameW, frameZ),
    ],
    normal: { x: 0, y: 1, z: 0 }, // facing up
  });

  // Left reveal
  quads.push({
    corners: [
      rot(-hw + frameW, frameW, frameZ),
      rot(-hw + frameW, frameW, glassZ),
      rot(-hw + frameW, height - frameW, glassZ),
      rot(-hw + frameW, height - frameW, frameZ),
    ],
    normal: {
      x: cosR,  // perpendicular to wall, pointing inward-right
      y: 0,
      z: -sinR,
    },
  });

  // Right reveal
  quads.push({
    corners: [
      rot(hw - frameW, frameW, glassZ),
      rot(hw - frameW, frameW, frameZ),
      rot(hw - frameW, height - frameW, frameZ),
      rot(hw - frameW, height - frameW, glassZ),
    ],
    normal: {
      x: -cosR, // perpendicular to wall, pointing inward-left
      y: 0,
      z: sinR,
    },
  });

  // --- Quad 6: Sill (thin shelf projecting forward) ---
  const sillH = frameW * 0.5;
  const sillProjection = frameW * 0.8;
  quads.push({
    corners: [
      rot(-hw - sillProjection * 0.3, 0, sillZ),
      rot(hw + sillProjection * 0.3, 0, sillZ),
      rot(hw + sillProjection * 0.3, sillH, sillZ),
      rot(-hw - sillProjection * 0.3, sillH, sillZ),
    ],
    normal: wallNormal,
  });

  // --- Mullion bars (in front of glass, behind frame) ---
  if (mullions > 0) {
    const innerW = width - frameW * 2;
    const mullionZ = (frameZ + glassZ) / 2; // midway in the reveal
    for (let m = 1; m <= mullions; m++) {
      const t = m / (mullions + 1);
      const mx = -hw + frameW + t * innerW;
      const barW = frameW * 0.4;

      quads.push({
        corners: [
          rot(mx - barW / 2, frameW, mullionZ),
          rot(mx + barW / 2, frameW, mullionZ),
          rot(mx + barW / 2, height - frameW, mullionZ),
          rot(mx - barW / 2, height - frameW, mullionZ),
        ],
        normal: wallNormal,
      });
    }
  }

  // Horizontal transom bar (if arched or multi-part)
  if (hasArch) {
    const transomY = height * 0.65;
    const mullionZ = (frameZ + glassZ) / 2;
    quads.push({
      corners: [
        rot(-hw + frameW, transomY - frameW * 0.3, mullionZ),
        rot(hw - frameW, transomY - frameW * 0.3, mullionZ),
        rot(hw - frameW, transomY + frameW * 0.3, mullionZ),
        rot(-hw + frameW, transomY + frameW * 0.3, mullionZ),
      ],
      normal: wallNormal,
    });
  }

  return quads;
}

// ---------------------------------------------------------------------------
// Draw function
// ---------------------------------------------------------------------------

/**
 * Draw a recessed window.
 * Quad order: 0=frame, 1=glass, 2-5=reveals, 6=sill, 7+=mullions
 */
function drawWindow(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  if (projected.length === 0) return;

  for (let i = 0; i < projected.length; i++) {
    const sq = projected[i]!;
    if (!sq.visible) continue;

    if (i === 0) {
      // Frame surround — prominent stroke, light fill matching wall
      const frameStyle: RenderStyle = {
        ...style,
        strokeWeight: style.strokeWeight * 1.6,
        opacity: Math.min(1, style.opacity * 1.1),
      };
      drawQuad(ctx, sq, frameStyle);
    } else if (i === 1) {
      // Glass pane — near-black void, full opacity, no stroke
      const glassStyle: RenderStyle = {
        ...style,
        fillColor: "#0a0a18",
        strokeColor: "#0a0a18",
        strokeWeight: style.strokeWeight * 0.3,
        opacity: 1.0,
        lighting: "shadow", // always dark — it's a void
      };
      drawQuad(ctx, sq, glassStyle);

      // Highlight streak — single thin light mark across glass at ~30°
      const c = sq.corners;
      const mx = (c[0].x + c[1].x + c[2].x + c[3].x) / 4;
      const my = (c[0].y + c[1].y + c[2].y + c[3].y) / 4;
      const w = Math.abs(c[1].x - c[0].x) * 0.7;
      const angle = Math.PI / 6;
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(0.5, style.strokeWeight * 0.4);
      ctx.beginPath();
      ctx.moveTo(mx - Math.cos(angle) * w / 2, my - Math.sin(angle) * w / 2);
      ctx.lineTo(mx + Math.cos(angle) * w / 2, my + Math.sin(angle) * w / 2);
      ctx.stroke();
    } else if (i >= 2 && i <= 5) {
      // Reveal quads — shadow-toned, darker than wall
      const revealStyle: RenderStyle = {
        ...style,
        fillColor: "#2a2520",
        strokeWeight: style.strokeWeight * 0.6,
        opacity: style.opacity * 0.85,
        lighting: "shadow", // reveals are always in shadow
      };
      drawQuad(ctx, sq, revealStyle);
    } else if (i === 6) {
      // Sill — slightly lighter than frame, thick bottom stroke
      const sillStyle: RenderStyle = {
        ...style,
        strokeWeight: style.strokeWeight * 1.3,
        opacity: Math.min(1, style.opacity * 1.05),
      };
      drawQuad(ctx, sq, sillStyle);
    } else {
      // Mullion/transom bars
      const mullionStyle: RenderStyle = {
        ...style,
        strokeWeight: style.strokeWeight * 0.8,
        opacity: Math.min(1, style.opacity * 0.95),
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
    el.width, el.height, el.depth, el.rotation,
    0, false,
  );
  return { quads, draw: drawWindow };
});

registerElement("window-paired", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.depth, el.rotation,
    1, false,
  );
  return { quads, draw: drawWindow };
});

registerElement("window-arched", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.depth, el.rotation,
    0, true,
  );
  return { quads, draw: drawWindow };
});

registerElement("window-rose", (el) => {
  // Rose window — circular, rendered as an octagonal frame
  const { position, width, height, depth, rotation } = el;
  const r = Math.min(width, height) / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const halfD = depth / 2;

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
    const ir = r * 0.7;

    quads.push({
      corners: [
        rot(Math.cos(a0) * ir, height / 2 + Math.sin(a0) * ir, halfD - depth * 0.5),
        rot(Math.cos(a1) * ir, height / 2 + Math.sin(a1) * ir, halfD - depth * 0.5),
        rot(Math.cos(a1) * r, height / 2 + Math.sin(a1) * r, halfD),
        rot(Math.cos(a0) * r, height / 2 + Math.sin(a0) * r, halfD),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        // Inner segments get dark void fill
        const voidStyle: RenderStyle = {
          ...style,
          fillColor: "#0a0a18",
          opacity: style.opacity * 0.9,
          lighting: "shadow",
        };
        drawQuad(ctx, sq, voidStyle);
      }
    },
  };
});

registerElement("window-lancet", (el) => {
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.depth, el.rotation,
    0, true,
  );
  return { quads, draw: drawWindow };
});

registerElement("window-dormer", (el) => {
  // Dormer — window with small roof above
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height * 0.75, el.depth, el.rotation,
    0, false,
  );

  // Small gable roof above
  const hw = el.width / 2;
  const roofH = el.height * 0.25;
  const baseY = el.position.y + el.height * 0.75;
  const cosR = Math.cos(el.rotation);
  const sinR = Math.sin(el.rotation);
  const halfD = el.depth / 2;
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: el.position.x + lx * cosR + lz * sinR,
    y: baseY + ly,
    z: el.position.z - lx * sinR + lz * cosR,
  });

  quads.push({
    corners: [
      rot(-hw, 0, halfD),
      rot(hw, 0, halfD),
      rot(0, roofH, halfD),
      rot(0, roofH, halfD), // degenerate triangle as quad
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  return { quads, draw: drawWindow };
});

registerElement("window-ribbon", (el) => {
  // Ribbon window — wide horizontal, multiple mullions
  const quads = makeWindowQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.depth, el.rotation,
    3, false,
  );
  return { quads, draw: drawWindow };
});

registerElement("window-oculus", (el) => {
  // Oculus — small circular window (reuse rose window logic at smaller scale)
  const { position, width, height, depth, rotation } = el;
  const r = Math.min(width, height) / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const halfD = depth / 2;

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
        rot(Math.cos(a0) * ir, height / 2 + Math.sin(a0) * ir, halfD - depth * 0.5),
        rot(Math.cos(a1) * ir, height / 2 + Math.sin(a1) * ir, halfD - depth * 0.5),
        rot(Math.cos(a1) * r, height / 2 + Math.sin(a1) * r, halfD),
        rot(Math.cos(a0) * r, height / 2 + Math.sin(a0) * r, halfD),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        const voidStyle: RenderStyle = {
          ...style,
          fillColor: "#0a0a18",
          opacity: style.opacity * 0.9,
          lighting: "shadow",
        };
        drawQuad(ctx, sq, voidStyle);
      }
    },
  };
});
