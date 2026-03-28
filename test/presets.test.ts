import { describe, it, expect } from "vitest";
import { ALL_PRESETS, getPreset, filterPresets, searchPresets } from "../src/presets/index.js";

describe("presets", () => {
  it("has 21 presets", () => {
    expect(ALL_PRESETS.length).toBe(21);
  });

  it("each preset has required fields", () => {
    for (const preset of ALL_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.config).toBeTruthy();
      expect(preset.config.style).toBeTruthy();
      expect(preset.config.seed).toBeGreaterThanOrEqual(0);
    }
  });

  it("getPreset returns correct preset", () => {
    const preset = getPreset("greek-temple");
    expect(preset).toBeDefined();
    expect(preset!.config.style).toBe("classical");
  });

  it("getPreset returns undefined for unknown id", () => {
    expect(getPreset("nonexistent")).toBeUndefined();
  });

  it("filterPresets by style", () => {
    const gothic = filterPresets("gothic");
    expect(gothic.length).toBe(2); // cathedral + chapel
    for (const p of gothic) {
      expect(p.config.style).toBe("gothic");
    }
  });

  it("filterPresets with no style returns all", () => {
    const all = filterPresets();
    expect(all.length).toBe(ALL_PRESETS.length);
  });

  it("searchPresets by keyword", () => {
    const results = searchPresets("ruin");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.id === "ruin")).toBe(true);
  });

  it("searchPresets is case-insensitive", () => {
    const results = searchPresets("GOTHIC");
    expect(results.length).toBeGreaterThan(0);
  });
});
