import { describe, it, expect } from "vitest";
import { mulberry32 } from "../src/shared/prng.js";
import { parseHex, toHex, lerpColor, darken, lighten, varyColor } from "../src/shared/color-utils.js";

describe("mulberry32", () => {
  it("produces deterministic sequence", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect(a()).toBe(b());
    expect(a()).toBe(b());
    expect(a()).toBe(b());
  });

  it("different seeds produce different sequences", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("produces values in [0, 1)", () => {
    const rand = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("color-utils", () => {
  it("parseHex parses 6-digit hex", () => {
    expect(parseHex("#ff0000")).toEqual([255, 0, 0]);
    expect(parseHex("00ff00")).toEqual([0, 255, 0]);
    expect(parseHex("#0000ff")).toEqual([0, 0, 255]);
  });

  it("toHex converts to hex string", () => {
    expect(toHex(255, 0, 0)).toBe("#ff0000");
    expect(toHex(0, 255, 0)).toBe("#00ff00");
    expect(toHex(0, 0, 255)).toBe("#0000ff");
  });

  it("toHex clamps values", () => {
    expect(toHex(300, -10, 128)).toBe("#ff0080");
  });

  it("lerpColor interpolates between colors", () => {
    expect(lerpColor("#000000", "#ffffff", 0)).toBe("#000000");
    expect(lerpColor("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(lerpColor("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("darken reduces brightness", () => {
    expect(darken("#ffffff", 0)).toBe("#ffffff");
    expect(darken("#ffffff", 1)).toBe("#000000");
    const half = darken("#ffffff", 0.5);
    expect(parseHex(half)[0]).toBeCloseTo(128, 0);
  });

  it("lighten increases brightness", () => {
    expect(lighten("#000000", 0)).toBe("#000000");
    expect(lighten("#000000", 1)).toBe("#ffffff");
  });

  it("varyColor produces a modified color", () => {
    const rand = mulberry32(42);
    const varied = varyColor("#808080", 0.1, rand);
    expect(varied).not.toBe("#808080"); // very likely different
    expect(varied.startsWith("#")).toBe(true);
    expect(varied.length).toBe(7);
  });
});
