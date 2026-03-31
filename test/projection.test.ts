import { describe, it, expect } from "vitest";
import { createCamera, viewProjectionMatrix } from "@genart-dev/projection";
import {
  makeViewport,
  projectQuad,
  projectQuads,
  isBuildingVisible,
  depthAdjustedStyle,
  buildEdgeAdjacency,
  classifyQuadEdges,
  classifyProjectedQuads,
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

describe("buildEdgeAdjacency", () => {
  it("finds shared edges between adjacent quads", () => {
    // Two quads sharing an edge at x=0
    const quads: WorldQuad[] = [
      {
        corners: [
          { x: -1, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: -1, y: 1, z: 0 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
      {
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 1, z: 0 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
    ];

    const adj = buildEdgeAdjacency(quads);
    // The shared edge (0,0,0)-(0,1,0) should have both quad indices
    let sharedCount = 0;
    for (const entry of adj.values()) {
      if (entry.quadIndices.length === 2) sharedCount++;
    }
    expect(sharedCount).toBe(1);
  });
});

describe("classifyQuadEdges", () => {
  it("classifies ground edges at y≈0", () => {
    const quad: WorldQuad = {
      corners: [
        { x: -1, y: 0, z: 10 },
        { x: 1, y: 0, z: 10 },
        { x: 1, y: 2, z: 10 },
        { x: -1, y: 2, z: 10 },
      ],
      normal: { x: 0, y: 0, z: -1 },
    };

    const adj = buildEdgeAdjacency([quad]);
    const classes = classifyQuadEdges(0, [quad], [true], adj);

    // Bottom edge (corner 0→1) has both y=0 → ground
    expect(classes[0]).toBe("ground");
    // Other edges have no neighbors → silhouette
    expect(classes[1]).toBe("silhouette");
    expect(classes[2]).toBe("silhouette");
    expect(classes[3]).toBe("silhouette");
  });

  it("classifies shared coplanar edges as detail", () => {
    const quads: WorldQuad[] = [
      {
        corners: [
          { x: -1, y: 0.5, z: 10 },
          { x: 0, y: 0.5, z: 10 },
          { x: 0, y: 2, z: 10 },
          { x: -1, y: 2, z: 10 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
      {
        corners: [
          { x: 0, y: 0.5, z: 10 },
          { x: 1, y: 0.5, z: 10 },
          { x: 1, y: 2, z: 10 },
          { x: 0, y: 2, z: 10 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
    ];

    const adj = buildEdgeAdjacency(quads);
    const classes0 = classifyQuadEdges(0, quads, [true, true], adj);

    // Edge 1 (corner 1→2 of quad 0) is shared with quad 1, same normal → detail
    expect(classes0[1]).toBe("detail");
  });

  it("classifies perpendicular shared edges as fold", () => {
    // Front face and right face of a box share an edge at x=1
    const quads: WorldQuad[] = [
      {
        corners: [
          { x: -1, y: 1, z: 10 },
          { x: 1, y: 1, z: 10 },
          { x: 1, y: 3, z: 10 },
          { x: -1, y: 3, z: 10 },
        ],
        normal: { x: 0, y: 0, z: -1 }, // Front face
      },
      {
        corners: [
          { x: 1, y: 1, z: 10 },
          { x: 1, y: 1, z: 12 },
          { x: 1, y: 3, z: 12 },
          { x: 1, y: 3, z: 10 },
        ],
        normal: { x: 1, y: 0, z: 0 }, // Right face
      },
    ];

    const adj = buildEdgeAdjacency(quads);
    const classes0 = classifyQuadEdges(0, quads, [true, true], adj);

    // Edge 1 (corner 1→2) is shared with the right face at 90° → fold
    expect(classes0[1]).toBe("fold");
  });
});

describe("classifyProjectedQuads", () => {
  it("returns ClassifiedScreenQuads with edge data", () => {
    const camera = createCamera();
    const viewport = makeViewport(800, 600);

    const quads: WorldQuad[] = [
      {
        corners: [
          { x: -2, y: 0, z: 20 },
          { x: 2, y: 0, z: 20 },
          { x: 2, y: 4, z: 20 },
          { x: -2, y: 4, z: 20 },
        ],
        normal: { x: 0, y: 0, z: -1 },
      },
    ];

    const screenQuads = projectQuads(quads, camera, viewport);
    const vpMatrix = viewProjectionMatrix(camera, viewport);
    const classified = classifyProjectedQuads(quads, screenQuads, camera, viewport, vpMatrix);

    expect(classified).toHaveLength(1);
    expect(classified[0]!.edgeClasses).toBeDefined();
    expect(classified[0]!.edgeClasses).toHaveLength(4);
    expect(typeof classified[0]!.screenNormalAngle).toBe("number");
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

  it("distant objects have reduced opacity in illustration modes", () => {
    // Filled mode is always 1.0; test with pencil mode for atmospheric fade
    const nearby = depthAdjustedStyle(palette, 0.1, 10, 1, false, "wall", 0, "pencil");
    const distant = depthAdjustedStyle(palette, 0.9, 1, 1, false, "wall", 0, "pencil");
    expect(distant.opacity).toBeLessThan(nearby.opacity);
    expect(distant.opacity).toBeGreaterThanOrEqual(0.6); // opacity floor
  });

  it("filled mode is fully opaque regardless of depth", () => {
    const distant = depthAdjustedStyle(palette, 0.9, 1, 1, false);
    expect(distant.opacity).toBe(1);
  });

  it("wireframe mode is passed through", () => {
    const style = depthAdjustedStyle(palette, 0.5, 5, 1, true);
    expect(style.wireframe).toBe(true);
  });

  it("classifies face lighting from faceDot", () => {
    const lit = depthAdjustedStyle(palette, 0.1, 5, 1, false, "wall", 0.8);
    expect(lit.lighting).toBe("lit");

    const ambient = depthAdjustedStyle(palette, 0.1, 5, 1, false, "wall", 0.1);
    expect(ambient.lighting).toBe("ambient");

    const shadow = depthAdjustedStyle(palette, 0.1, 5, 1, false, "wall", -0.5);
    expect(shadow.lighting).toBe("shadow");
  });
});
