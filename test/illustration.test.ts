import { describe, it, expect, vi } from "vitest";
import { getStrategy } from "../src/illustration/strategies.js";
import { drawMarks } from "../src/illustration/draw-marks.js";
import {
  drawQuadIllustrated,
  drawQuadWithHatchingIllustrated,
} from "../src/illustration/quad-illust.js";
import type { ScreenQuad, RenderStyle } from "../src/types.js";

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------

function mockCtx(): CanvasRenderingContext2D {
  const calls: string[] = [];
  return {
    beginPath: vi.fn(() => calls.push("beginPath")),
    moveTo: vi.fn(() => calls.push("moveTo")),
    lineTo: vi.fn(() => calls.push("lineTo")),
    closePath: vi.fn(() => calls.push("closePath")),
    stroke: vi.fn(() => calls.push("stroke")),
    fill: vi.fn(() => calls.push("fill")),
    save: vi.fn(),
    restore: vi.fn(),
    globalAlpha: 1,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    _calls: calls,
  } as unknown as CanvasRenderingContext2D;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const VISIBLE_QUAD: ScreenQuad = {
  corners: [
    { x: 100, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 50 },
    { x: 100, y: 50 },
  ],
  depth: 0.5,
  scale: 5,
  visible: true,
};

const INVISIBLE_QUAD: ScreenQuad = {
  corners: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  depth: -1,
  scale: 0,
  visible: false,
};

const BASE_STYLE: RenderStyle = {
  strokeColor: "#3a3020",
  fillColor: "#e8dcc8",
  strokeWeight: 1.5,
  opacity: 0.9,
  detail: 0.8,
  wireframe: false,
  renderMode: "pencil",
};

// ---------------------------------------------------------------------------
// Strategy resolution
// ---------------------------------------------------------------------------

describe("getStrategy", () => {
  it("returns pencil strategy", () => {
    const s = getStrategy("pencil");
    expect(s.mark.id).toBe("pencil");
    expect(s.fill.id).toBe("hatch");
  });

  it("returns ink strategy", () => {
    const s = getStrategy("ink");
    expect(s.mark.id).toBe("ink");
  });

  it("returns technical strategy", () => {
    const s = getStrategy("technical");
    expect(s.mark.id).toBe("technical");
  });

  it("returns engraving strategy with crosshatch fill", () => {
    const s = getStrategy("engraving");
    expect(s.mark.id).toBe("engraving");
    expect(s.fill.id).toBe("crosshatch");
  });

  it("returns woodcut strategy with stipple fill", () => {
    const s = getStrategy("woodcut");
    expect(s.mark.id).toBe("woodcut");
    expect(s.fill.id).toBe("stipple");
  });
});

// ---------------------------------------------------------------------------
// drawMarks
// ---------------------------------------------------------------------------

describe("drawMarks", () => {
  it("draws marks as polylines on canvas", () => {
    const ctx = mockCtx();
    const marks = [
      { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], width: 2, opacity: 0.8 },
      { points: [{ x: 5, y: 5 }, { x: 15, y: 15 }], width: 1, opacity: 0.5 },
    ];

    drawMarks(ctx, marks, "#000000", 1.0);

    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    expect(ctx.moveTo).toHaveBeenCalledTimes(2);
    expect(ctx.lineTo).toHaveBeenCalledTimes(2);
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
  });

  it("skips marks with fewer than 2 points", () => {
    const ctx = mockCtx();
    const marks = [
      { points: [{ x: 0, y: 0 }], width: 2, opacity: 0.8 },
    ];

    drawMarks(ctx, marks, "#000000", 1.0);

    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it("applies base opacity multiplied by mark opacity", () => {
    const ctx = mockCtx();
    const marks = [
      { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], width: 2, opacity: 0.5 },
    ];

    drawMarks(ctx, marks, "#000", 0.8);

    expect(ctx.globalAlpha).toBeCloseTo(0.4, 1);
  });
});

// ---------------------------------------------------------------------------
// drawQuadIllustrated
// ---------------------------------------------------------------------------

describe("drawQuadIllustrated", () => {
  it("produces marks for a visible quad", () => {
    const ctx = mockCtx();
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };

    drawQuadIllustrated(ctx, VISIBLE_QUAD, BASE_STYLE, rng);

    // Should have drawn something (fill marks + edge marks)
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("does nothing for invisible quads", () => {
    const ctx = mockCtx();
    const rng = () => 0.5;

    drawQuadIllustrated(ctx, INVISIBLE_QUAD, BASE_STYLE, rng);

    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it("skips fill in wireframe mode", () => {
    const ctx = mockCtx();
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };

    const wireframeStyle: RenderStyle = { ...BASE_STYLE, wireframe: true };
    drawQuadIllustrated(ctx, VISIBLE_QUAD, wireframeStyle, rng);

    // Should still draw edge strokes
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("works with all render modes", () => {
    const modes = ["pencil", "ink", "technical", "engraving", "woodcut"] as const;

    for (const mode of modes) {
      const ctx = mockCtx();
      let seed = 42;
      const rng = () => {
        seed = (seed * 1664525 + 1013904223) | 0;
        return (seed >>> 0) / 4294967296;
      };

      const style: RenderStyle = { ...BASE_STYLE, renderMode: mode };
      drawQuadIllustrated(ctx, VISIBLE_QUAD, style, rng);

      expect(ctx.stroke).toHaveBeenCalled();
    }
  });
});

// ---------------------------------------------------------------------------
// drawQuadWithHatchingIllustrated
// ---------------------------------------------------------------------------

describe("drawQuadWithHatchingIllustrated", () => {
  it("produces marks with hatching for a visible quad", () => {
    const ctx = mockCtx();
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };

    drawQuadWithHatchingIllustrated(ctx, VISIBLE_QUAD, BASE_STYLE, rng, 0, 6);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("does nothing for invisible quads", () => {
    const ctx = mockCtx();
    const rng = () => 0.5;

    drawQuadWithHatchingIllustrated(ctx, INVISIBLE_QUAD, BASE_STYLE, rng, 0, 6);

    expect(ctx.beginPath).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Integration: depthAdjustedStyle carries renderMode
// ---------------------------------------------------------------------------

describe("renderMode propagation", () => {
  it("depthAdjustedStyle passes renderMode through", async () => {
    const { depthAdjustedStyle } = await import("../src/projection/bridge.js");
    const palette = {
      wall: "#e8dcc8",
      roof: "#c4956a",
      trim: "#d4c4a8",
      opening: "#1a1a2e",
      structure: "#d8cbb0",
      stroke: "#3a3020",
    };

    const style = depthAdjustedStyle(palette, 0.3, 5, 1, false, "wall", 0, "pencil");
    expect(style.renderMode).toBe("pencil");
  });

  it("depthAdjustedStyle defaults to filled", async () => {
    const { depthAdjustedStyle } = await import("../src/projection/bridge.js");
    const palette = {
      wall: "#e8dcc8",
      roof: "#c4956a",
      trim: "#d4c4a8",
      opening: "#1a1a2e",
      structure: "#d8cbb0",
      stroke: "#3a3020",
    };

    const style = depthAdjustedStyle(palette, 0.3, 5, 1, false);
    expect(style.renderMode).toBe("filled");
  });
});
