import type { Vec3 } from "@genart-dev/projection";
import type { WorldQuad } from "../types.js";
import { drawQuad, makeBox, registerElement } from "./renderer.js";

// Beams, buttresses, galleries, balconies — structural elements
// that aren't columns, arches, or walls.

registerElement("beam-timber", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        drawQuad(ctx, sq, { ...style, fillColor: "#6b4226" });
      }
    },
  };
});

registerElement("beam-stone", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("beam-steel", (el) => {
  // I-beam profile — simplified as a narrow box
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth * 0.3, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        drawQuad(ctx, sq, { ...style, fillColor: "#4a4a4a" });
      }
    },
  };
});

registerElement("buttress-flat", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("buttress-stepped", (el) => {
  const { position, width, height, depth, rotation } = el;
  const quads: WorldQuad[] = [];
  // Three steps tapering upward
  const steps = 3;
  for (let s = 0; s < steps; s++) {
    const t = s / steps;
    const stepH = height / steps;
    const stepW = width * (1 - t * 0.3);
    const stepD = depth * (1 - t * 0.4);
    const stepY = position.y + s * stepH + stepH / 2;

    quads.push(...makeBox(
      position.x, stepY, position.z,
      stepW, stepH, stepD, rotation,
    ));
  }

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("buttress-flying", (el) => {
  // Simplified: arch + pier
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("balcony-juliet", (el) => {
  // Thin railing, no floor projection
  const { position, width, height, depth, rotation } = el;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const hw = width / 2;
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: position.x + lx * cosR + lz * sinR,
    y: position.y + ly,
    z: position.z - lx * sinR + lz * cosR,
  });

  const quads: WorldQuad[] = [{
    corners: [
      rot(-hw, 0, depth / 2 + 0.05),
      rot(hw, 0, depth / 2 + 0.05),
      rot(hw, height, depth / 2 + 0.05),
      rot(-hw, height, depth / 2 + 0.05),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  }];

  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) {
        drawQuad(ctx, sq, { ...style, opacity: style.opacity * 0.7 });
      }
    },
  };
});

registerElement("balcony-cantilevered", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("gallery-arcade", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});

registerElement("gallery-colonnade", (el) => {
  const quads = makeBox(
    el.position.x, el.position.y + el.height / 2, el.position.z,
    el.width, el.height, el.depth, el.rotation,
  );
  return {
    quads,
    draw: (ctx, projected, style) => {
      for (const sq of projected) drawQuad(ctx, sq, style);
    },
  };
});
