import type { Vec3 } from "@genart-dev/projection";
import type {
  ElementInstance,
  ElementRenderResult,
  RenderStyle,
  ScreenQuad,
  WorldQuad,
} from "../types.js";
import { drawQuad, registerElement } from "./renderer.js";

function makeDoorQuads(
  cx: number,
  cy: number,
  cz: number,
  width: number,
  height: number,
  rotation: number,
  panels: number,
): WorldQuad[] {
  const hw = width / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: cx + lx * cosR + lz * sinR,
    y: cy + ly,
    z: cz - lx * sinR + lz * cosR,
  });

  const frameW = width * 0.1;
  const quads: WorldQuad[] = [];

  // Door frame
  quads.push({
    corners: [
      rot(-hw, 0, 0.03),
      rot(hw, 0, 0.03),
      rot(hw, height, 0.03),
      rot(-hw, height, 0.03),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Door surface (slightly recessed)
  quads.push({
    corners: [
      rot(-hw + frameW, 0, 0),
      rot(hw - frameW, 0, 0),
      rot(hw - frameW, height - frameW, 0),
      rot(-hw + frameW, height - frameW, 0),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  // Panel insets
  if (panels > 0) {
    const innerW = width - frameW * 2;
    const innerH = height - frameW;
    const panelH = innerH / panels;
    const panelInset = frameW * 0.3;

    for (let p = 0; p < panels; p++) {
      const py = panelInset + p * panelH + panelInset;
      quads.push({
        corners: [
          rot(-hw + frameW + panelInset, py, -0.01),
          rot(hw - frameW - panelInset, py, -0.01),
          rot(hw - frameW - panelInset, py + panelH - panelInset * 2, -0.01),
          rot(-hw + frameW + panelInset, py + panelH - panelInset * 2, -0.01),
        ],
        normal: { x: sinR, y: 0, z: cosR },
      });
    }
  }

  return quads;
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  projected: ScreenQuad[],
  style: RenderStyle,
): void {
  for (let i = 0; i < projected.length; i++) {
    const sq = projected[i]!;
    if (!sq.visible) continue;

    if (i === 1) {
      // Door surface — darker wood color
      const doorStyle: RenderStyle = {
        ...style,
        fillColor: "#5c3a1e",
      };
      drawQuad(ctx, sq, doorStyle);
    } else if (i >= 2) {
      // Panel insets — even darker
      const panelStyle: RenderStyle = {
        ...style,
        fillColor: "#4a2e15",
        strokeWeight: style.strokeWeight * 0.5,
      };
      drawQuad(ctx, sq, panelStyle);
    } else {
      drawQuad(ctx, sq, style);
    }
  }
}

registerElement("door-simple", (el) => {
  const quads = makeDoorQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation, 0,
  );
  return { quads, draw: drawDoor };
});

registerElement("door-arched", (el) => {
  // Reuses flat door geometry — arch detail added at higher detail levels
  const quads = makeDoorQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation, 0,
  );
  return { quads, draw: drawDoor };
});

registerElement("door-double", (el) => {
  const quads = makeDoorQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height, el.rotation, 2,
  );
  return { quads, draw: drawDoor };
});

registerElement("door-portal", (el) => {
  // Portal with tympanum — elaborately framed entrance
  const quads = makeDoorQuads(
    el.position.x, el.position.y, el.position.z,
    el.width, el.height * 0.75, el.rotation, 2,
  );

  // Tympanum (semi-circular area above)
  const hw = el.width / 2;
  const cosR = Math.cos(el.rotation);
  const sinR = Math.sin(el.rotation);
  const rot = (lx: number, ly: number, lz: number): Vec3 => ({
    x: el.position.x + lx * cosR + lz * sinR,
    y: el.position.y + ly,
    z: el.position.z - lx * sinR + lz * cosR,
  });

  const archBase = el.height * 0.75;
  quads.push({
    corners: [
      rot(-hw, archBase, 0.03),
      rot(hw, archBase, 0.03),
      rot(0, el.height, 0.03),
      rot(0, el.height, 0.03),
    ],
    normal: { x: sinR, y: 0, z: cosR },
  });

  return { quads, draw: drawDoor };
});
