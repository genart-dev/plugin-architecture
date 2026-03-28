import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, drawQuadWithHatching, makeBox, registerElement } from "./renderer.js";

function drawWall(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuad(ctx, sq, style);
  }
}

function drawWallWithCoursing(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuadWithHatching(ctx, sq, style, 0, 6);
  }
}

registerElement("wall-masonry", (el) => {
  const quads = makeBox(
    el.position.x,
    el.position.y + el.height / 2,
    el.position.z,
    el.width,
    el.height,
    el.depth,
    el.rotation,
  );
  return { quads, draw: drawWallWithCoursing };
});

registerElement("wall-curtain", (el) => {
  const quads = makeBox(
    el.position.x,
    el.position.y + el.height / 2,
    el.position.z,
    el.width,
    el.height,
    el.depth * 0.3,
    el.rotation,
  );
  return { quads, draw: drawWall };
});

registerElement("wall-timber-frame", (el) => {
  const { position, width, height, depth, rotation } = el;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const hw = width / 2;
  const halfD = depth / 2;
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  const quads: WorldQuad[] = [];
  const n: Vec3 = { x: sinR, y: 0, z: cosR };

  // Infill panel (front face)
  quads.push({
    corners: [
      rot(-hw, 0, halfD),
      rot(hw, 0, halfD),
      rot(hw, height, halfD),
      rot(-hw, height, halfD),
    ],
    normal: n,
  });

  // Timber frame members (horizontal and vertical)
  const beamW = width * 0.08;

  // Bottom sill
  quads.push({
    corners: [
      rot(-hw, 0, halfD + 0.02),
      rot(hw, 0, halfD + 0.02),
      rot(hw, beamW, halfD + 0.02),
      rot(-hw, beamW, halfD + 0.02),
    ],
    normal: n,
  });

  // Top plate
  quads.push({
    corners: [
      rot(-hw, height - beamW, halfD + 0.02),
      rot(hw, height - beamW, halfD + 0.02),
      rot(hw, height, halfD + 0.02),
      rot(-hw, height, halfD + 0.02),
    ],
    normal: n,
  });

  // Vertical studs
  const studs = Math.max(2, Math.floor(width / 1.5));
  for (let s = 0; s <= studs; s++) {
    const x = -hw + (s / studs) * width;
    quads.push({
      corners: [
        rot(x - beamW / 2, 0, halfD + 0.02),
        rot(x + beamW / 2, 0, halfD + 0.02),
        rot(x + beamW / 2, height, halfD + 0.02),
        rot(x - beamW / 2, height, halfD + 0.02),
      ],
      normal: n,
    });
  }

  // Diagonal brace
  quads.push({
    corners: [
      rot(-hw + beamW, beamW, halfD + 0.02),
      rot(-hw + beamW * 2, beamW, halfD + 0.02),
      rot(hw - beamW, height - beamW, halfD + 0.02),
      rot(hw - beamW * 2, height - beamW, halfD + 0.02),
    ],
    normal: n,
  });

  return {
    quads,
    draw: (ctx, projected, style) => {
      if (projected.length === 0) return;
      // Infill panel first (index 0)
      const infill = projected[0]!;
      if (infill.visible) {
        const infillStyle: RenderStyle = {
          ...style,
          fillColor: "#f0e6d0", // Cream/plaster infill
        };
        drawQuad(ctx, infill, infillStyle);
      }
      // Timber members (darker wood)
      for (let i = 1; i < projected.length; i++) {
        const sq = projected[i]!;
        if (!sq.visible) continue;
        const timberStyle: RenderStyle = {
          ...style,
          fillColor: "#5c3a1e",
        };
        drawQuad(ctx, sq, timberStyle);
      }
    },
  };
});

registerElement("wall-glass", (el) => {
  const quads = makeBox(
    el.position.x,
    el.position.y + el.height / 2,
    el.position.z,
    el.width,
    el.height,
    el.depth * 0.15,
    el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        const glassStyle: RenderStyle = {
          ...style,
          fillColor: "#c8dce8",
          opacity: style.opacity * 0.7,
        };
        drawQuad(ctx, sq, glassStyle);
      }
    },
  };
});
