import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, makeBox, registerElement } from "./renderer.js";

function drawModern(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (const sq of projected) {
    drawQuad(ctx, sq, style);
  }
}

registerElement("diagrid", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("space-frame", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("exoskeleton", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("glass-curtain-wall", (el) => {
  const { position, width, height, depth, rotation } = el;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const hw = width / 2;
  const hd = depth / 2;
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  const quads: WorldQuad[] = [];
  const n: Vec3 = { x: sinR, y: 0, z: cosR };

  // Main glass panel
  quads.push({
    corners: [
      rot(-hw, 0, hd),
      rot(hw, 0, hd),
      rot(hw, height, hd),
      rot(-hw, height, hd),
    ],
    normal: n,
  });

  // Grid lines (mullions)
  const gridX = Math.max(2, Math.floor(width / 1.5));
  const gridY = Math.max(2, Math.floor(height / 3));
  const barW = 0.04;

  for (let gx = 0; gx <= gridX; gx++) {
    const x = -hw + (gx / gridX) * width;
    quads.push({
      corners: [
        rot(x - barW, 0, hd + 0.01),
        rot(x + barW, 0, hd + 0.01),
        rot(x + barW, height, hd + 0.01),
        rot(x - barW, height, hd + 0.01),
      ],
      normal: n,
    });
  }

  for (let gy = 0; gy <= gridY; gy++) {
    const y = (gy / gridY) * height;
    quads.push({
      corners: [
        rot(-hw, y - barW, hd + 0.01),
        rot(hw, y - barW, hd + 0.01),
        rot(hw, y + barW, hd + 0.01),
        rot(-hw, y + barW, hd + 0.01),
      ],
      normal: n,
    });
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      if (projected.length === 0) return;
      // Glass
      const glass = projected[0]!;
      if (glass.visible) {
        drawQuad(ctx, glass, {
          ...style,
          fillColor: "#b8d4e3",
          opacity: style.opacity * 0.6,
        });
      }
      // Mullions
      for (let i = 1; i < projected.length; i++) {
        const sq = projected[i]!;
        if (sq.visible) {
          drawQuad(ctx, sq, {
            ...style,
            fillColor: "#2a2a2a",
            strokeWeight: style.strokeWeight * 0.3,
          });
        }
      }
    },
  };
});

registerElement("parametric-panel", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("cantilever", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("twist", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});

registerElement("void-cutout", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return { quads, draw: drawModern };
});
