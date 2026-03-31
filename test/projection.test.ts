import { describe, it, expect } from "vitest";
import { createCamera } from "@genart-dev/projection";
import {
  makeViewport,
  projectQuad,
  projectQuads,
  isBuildingVisible,
  depthAdjustedStyle,
} from "../src/projection/index.js";
import { compositeBuilding, defaultBuildingConfig } from "../src/compositor.js";
import type { WorldQuad } from "../src/types.js";

describe("makeViewport", () => {
  it("creates a viewport from dimensions", () => {
    const vp = makeViewport(800, 600);
    expect(vp.x).toBe(0);
    expect(vp.y).toBe(0);
    expect(vp.width).toBe(800);
    expect(vp.height).toBe(600);
  });
});

describe("projectQuad", () => {
  const camera = createCamera();
  const viewport = makeViewport(800, 600);

  it("projects a visible front-facing quad", () => {
    const quad: WorldQuad = {
      corners: [
        { x: -2, y: 0, z: 20 },
        { x: 2, y: 0, z: 20 },
        { x: 2, y: 4, z: 20 },
        { x: -2, y: 4, z: 20 },
      ],
      normal: { x: 0, y: 0, z: -1 }, // Facing toward camera
    };

    const result = projectQuad(quad, camera, viewport);
    expect(result.visible).toBe(true);
    expect(result.depth).toBeGreaterThan(0);
    expect(result.scale).toBeGreaterThan(0);
  });

  it("culls a back-facing quad", () => {
    const quad: WorldQuad = {
      corners: [
        { x: -2, y: 0, z: 20 },
        { x: 2, y: 0, z: 20 },
        { x: 2, y: 4, z: 20 },
        { x: -2, y: 4, z: 20 },
      ],
      normal: { x: 0, y: 0, z: 1 }, // Facing away from camera
    };

    const result = projectQuad(quad, camera, viewport);
    expect(result.visible).toBe(false);
  });
});

describe("projectQuads", () => {
  it("projects multiple quads", () => {
    const camera = createCamera();
    const viewport = makeViewport(800, 600);

    const quads: WorldQuad[] = [
      {
        corners: [
          { x: -1, y: 0, z: 10 },
          { x: 1, y: 0, z: 10 },
          { x: 1, y: 2, z: 10 },
          { x: -1, y: 2, z: 10 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
      {
        corners: [
          { x: -1, y: 0, z: 50 },
          { x: 1, y: 0, z: 50 },
          { x: 1, y: 2, z: 50 },
          { x: -1, y: 2, z: 50 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
    ];

    const results = projectQuads(quads, camera, viewport);
    expect(results).toHaveLength(2);
    // Closer quad should have larger scale
    if (results[0]!.visible && results[1]!.visible) {
      expect(results[0]!.scale).toBeGreaterThan(results[1]!.scale);
    }
  });
});

describe("isBuildingVisible", () => {
  it("building in front of camera is visible", () => {
    const camera = createCamera();
    const viewport = makeViewport(800, 600);
    const config = defaultBuildingConfig({ seed: 42 });
    const building = compositeBuilding(config, 0, 30, 0);

    expect(isBuildingVisible(building, camera, viewport)).toBe(true);
  });

  it("building behind camera is not visible", () => {
    const camera = createCamera();
    const viewport = makeViewport(800, 600);
    const config = defaultBuildingConfig({ seed: 42 });
    const building = compositeBuilding(config, 0, -50, 0);

    expect(isBuildingVisible(building, camera, viewport)).toBe(false);
  });
});

describe("depthAdjustedStyle", () => {
  const palette = {
    wall: "#e8dcc8",
    roof: "#c4956a",
    trim: "#d4c4a8",
    opening: "#1a1a2e",
    structure: "#d8cbb0",
    stroke: "#3a3020",
  };

  it("nearby objects have full opacity", () => {
    const style = depthAdjustedStyle(palette, 0.1, 10, 1, false);
    expect(style.opacity).toBeGreaterThan(0.8);
    expect(style.detail).toBeGreaterThan(0.8);
  });

  it("distant objects have reduced opacity", () => {
    const nearby = depthAdjustedStyle(palette, 0.1, 10, 1, false);
    const distant = depthAdjustedStyle(palette, 0.9, 1, 1, false);
    expect(distant.opacity).toBeLessThan(nearby.opacity);
    expect(distant.opacity).toBeGreaterThanOrEqual(0.6); // opacity floor
  });

  it("wireframe mode is passed through", () => {
    const style = depthAdjustedStyle(palette, 0.5, 5, 1, true);
    expect(style.wireframe).toBe(true);
  });
});
