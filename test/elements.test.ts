import { describe, it, expect } from "vitest";
import { getElementRenderer, listRegisteredElements, makeBox } from "../src/elements/index.js";
import type { ElementInstance } from "../src/types.js";

describe("element registry", () => {
  it("registers 40+ element types", () => {
    const elements = listRegisteredElements();
    expect(elements.length).toBeGreaterThanOrEqual(40);
  });

  it("includes all column types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("column-doric");
    expect(elements).toContain("column-ionic");
    expect(elements).toContain("column-corinthian");
    expect(elements).toContain("column-simple");
    expect(elements).toContain("pilaster");
  });

  it("includes all arch types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("arch-round");
    expect(elements).toContain("arch-pointed");
    expect(elements).toContain("arch-horseshoe");
    expect(elements).toContain("arch-ogee");
    expect(elements).toContain("arch-lancet");
    expect(elements).toContain("arch-trefoil");
    expect(elements).toContain("arch-parabolic");
  });

  it("includes all window types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("window-single");
    expect(elements).toContain("window-paired");
    expect(elements).toContain("window-arched");
    expect(elements).toContain("window-rose");
    expect(elements).toContain("window-lancet");
    expect(elements).toContain("window-dormer");
    expect(elements).toContain("window-ribbon");
    expect(elements).toContain("window-oculus");
  });

  it("includes roof types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("roof-gable");
    expect(elements).toContain("roof-hip");
    expect(elements).toContain("roof-mansard");
    expect(elements).toContain("roof-dome");
    expect(elements).toContain("roof-flat");
    expect(elements).toContain("roof-barrel-vault");
    expect(elements).toContain("roof-spire");
  });

  it("includes wall types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("wall-masonry");
    expect(elements).toContain("wall-curtain");
    expect(elements).toContain("wall-timber-frame");
    expect(elements).toContain("wall-glass");
  });

  it("includes door types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("door-simple");
    expect(elements).toContain("door-arched");
    expect(elements).toContain("door-double");
    expect(elements).toContain("door-portal");
  });

  it("includes decorative types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("cornice");
    expect(elements).toContain("frieze");
    expect(elements).toContain("quoins");
    expect(elements).toContain("rustication");
    expect(elements).toContain("tracery");
    expect(elements).toContain("zellige");
    expect(elements).toContain("mashrabiya");
  });

  it("includes modern types", () => {
    const elements = listRegisteredElements();
    expect(elements).toContain("diagrid");
    expect(elements).toContain("glass-curtain-wall");
    expect(elements).toContain("cantilever");
  });
});

describe("element renderers", () => {
  const baseElement: ElementInstance = {
    type: "column-doric",
    position: { x: 0, y: 0, z: 10 },
    width: 0.5,
    height: 4,
    depth: 0.5,
    rotation: 0,
    detail: 1,
  };

  it("renders a column with non-empty quads", () => {
    const renderer = getElementRenderer("column-doric");
    const result = renderer(baseElement, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
    expect(typeof result.draw).toBe("function");
  });

  it("renders an arch with quads", () => {
    const renderer = getElementRenderer("arch-pointed");
    const result = renderer({ ...baseElement, type: "arch-pointed", width: 2, height: 3 }, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
  });

  it("renders a window with quads", () => {
    const renderer = getElementRenderer("window-rose");
    const result = renderer({ ...baseElement, type: "window-rose", width: 1.5, height: 1.5 }, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
  });

  it("renders a roof with quads", () => {
    const renderer = getElementRenderer("roof-gable");
    const result = renderer({ ...baseElement, type: "roof-gable", width: 8, height: 3, depth: 6 }, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
  });

  it("renders a wall with quads", () => {
    const renderer = getElementRenderer("wall-masonry");
    const result = renderer({ ...baseElement, type: "wall-masonry", width: 8, height: 6, depth: 0.5 }, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
  });

  it("falls back gracefully for unregistered types", () => {
    // Force cast to test fallback
    const renderer = getElementRenderer("nonexistent" as any);
    const result = renderer(baseElement, Math.random);
    expect(result.quads.length).toBeGreaterThan(0);
  });

  it("all registered elements produce quads", () => {
    const types = listRegisteredElements();
    for (const type of types) {
      const renderer = getElementRenderer(type);
      const result = renderer(
        { ...baseElement, type, width: 2, height: 3, depth: 1 },
        Math.random,
      );
      expect(result.quads.length).toBeGreaterThan(0);
    }
  });
});

describe("makeBox", () => {
  it("produces 6 quads for a box", () => {
    const quads = makeBox(0, 2, 5, 4, 4, 3, 0);
    expect(quads).toHaveLength(6);
  });

  it("each quad has 4 corners and a normal", () => {
    const quads = makeBox(0, 2, 5, 4, 4, 3, 0);
    for (const q of quads) {
      expect(q.corners).toHaveLength(4);
      expect(q.normal).toHaveProperty("x");
      expect(q.normal).toHaveProperty("y");
      expect(q.normal).toHaveProperty("z");
    }
  });

  it("handles rotation", () => {
    const quads = makeBox(0, 2, 5, 4, 4, 3, Math.PI / 4);
    expect(quads).toHaveLength(6);
    // Rotated corners should differ from unrotated
    const unrotated = makeBox(0, 2, 5, 4, 4, 3, 0);
    expect(quads[0]!.corners[0].x).not.toBe(unrotated[0]!.corners[0].x);
  });
});
