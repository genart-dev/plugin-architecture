import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

function makeBand(
  cx: number,
  cy: number,
  cz: number,
  width: number,
  height: number,
  depth: number,
  rotation: number,
): WorldQuad[] {
  const hw = width / 2;
  const hh = height / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  });

  // Front face only — decorative elements are surface details
  return [
    {
      corners: [
        rot(-hw, -hh, depth / 2 + 0.02),
        rot(hw, -hh, depth / 2 + 0.02),
        rot(hw, hh, depth / 2 + 0.02),
        rot(-hw, hh, depth / 2 + 0.02),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    },
  ];
}

function drawDecorative(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuad(ctx, sq, { ...style, fillColor: style.strokeColor, opacity: style.opacity * 0.6 });
  }
}

registerElement("cornice", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("frieze", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("string-course", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height * 0.3, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("quoins", (el) => {
  // Corner stones — series of alternating blocks
  const { position, width, height, depth, rotation } = el;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  const quads: WorldQuad[] = [];
  const blockH = height / 8;
  const hd = depth / 2;

  for (let i = 0; i < 8; i++) {
    const bw = i % 2 === 0 ? width : width * 0.7;
    const by = i * blockH;
    quads.push({
      corners: [
        rot(0, by, hd + 0.02),
        rot(bw, by, hd + 0.02),
        rot(bw, by + blockH * 0.9, hd + 0.02),
        rot(0, by + blockH * 0.9, hd + 0.02),
      ],
      normal: { x: sinR, y: 0, z: cosR },
    });
  }

  return { quads, draw: drawDecorative };
});

registerElement("rustication", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        drawQuad(ctx, sq, style);
        // Add coursing lines for rusticated texture
        if (!sq.visible || style.detail < 0.3) continue;
        const lines = Math.floor(style.detail * 6);
        ctx.globalAlpha = style.opacity * 0.4;
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWeight * 0.5;
        for (let i = 1; i < lines; i++) {
          const t = i / lines;
          const ly = sq.corners[0].y + (sq.corners[3].y - sq.corners[0].y) * t;
          const ry = sq.corners[1].y + (sq.corners[2].y - sq.corners[1].y) * t;
          ctx.beginPath();
          ctx.moveTo(sq.corners[0].x + (sq.corners[3].x - sq.corners[0].x) * t, ly);
          ctx.lineTo(sq.corners[1].x + (sq.corners[2].x - sq.corners[1].x) * t, ry);
          ctx.stroke();
        }
      }
    },
  };
});

registerElement("tracery", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("timber-framing", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("zellige", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});

registerElement("mashrabiya", (el) => {
  const quads = makeBand(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawDecorative };
});
