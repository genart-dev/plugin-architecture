import { describe, it, expect } from "vitest";
import { listStyles, listStyleGrammars, getStyle, requireStyle } from "../src/styles/index.js";
import type { StyleGrammar } from "../src/types.js";

describe("style registry", () => {
  it("registers 24 styles", () => {
    const styles = listStyles();
    expect(styles).toHaveLength(24);
  });

  it("includes all 14 historical styles", () => {
    const styles = listStyles();
    for (const s of [
      "classical", "roman", "romanesque", "gothic", "islamic",
      "chinese", "japanese", "tudor", "renaissance", "baroque",
      "georgian", "art-nouveau", "art-deco", "vernacular",
    ]) {
      expect(styles).toContain(s);
    }
  });

  it("includes all 5 modern styles", () => {
    const styles = listStyles();
    for (const s of ["modernist", "brutalist", "high-tech", "deconstructivist", "parametric"]) {
      expect(styles).toContain(s);
    }
  });

  it("includes all 5 experimental styles", () => {
    const styles = listStyles();
    for (const s of ["futuristic", "sculptural", "metabolist", "organic", "fantasy"]) {
      expect(styles).toContain(s);
    }
  });

  it("getStyle returns grammar for registered styles", () => {
    const classical = getStyle("classical");
    expect(classical).toBeDefined();
    expect(classical!.name).toBe("Classical / Greek");
    expect(classical!.character).toBeTruthy();
  });

  it("getStyle returns undefined for unknown style", () => {
    expect(getStyle("steampunk" as any)).toBeUndefined();
  });

  it("requireStyle throws for unknown style", () => {
    expect(() => requireStyle("steampunk" as any)).toThrow("Unknown architectural style: steampunk");
  });

  it("all grammars have complete palette", () => {
    const grammars = listStyleGrammars();
    for (const g of grammars) {
      expect(g.palette.wall).toBeTruthy();
      expect(g.palette.roof).toBeTruthy();
      expect(g.palette.trim).toBeTruthy();
      expect(g.palette.opening).toBeTruthy();
      expect(g.palette.structure).toBeTruthy();
      expect(g.palette.stroke).toBeTruthy();
    }
  });

  it("all grammars have proportions", () => {
    const grammars = listStyleGrammars();
    for (const g of grammars) {
      expect(g.proportions.storyHeight).toBeGreaterThan(0);
      expect(g.proportions.bayWidth).toBeGreaterThan(0);
      expect(g.proportions.wallThickness).toBeGreaterThan(0);
    }
  });

  it("all grammars have at least one roof form", () => {
    const grammars = listStyleGrammars();
    for (const g of grammars) {
      expect(g.roofForms.length).toBeGreaterThan(0);
    }
  });

  it("all grammars have at least one wall type", () => {
    const grammars = listStyleGrammars();
    for (const g of grammars) {
      expect(g.elements.walls.length).toBeGreaterThan(0);
    }
  });

  it("classical has columns, gothic has buttresses, modernist has no arches", () => {
    const classical = requireStyle("classical");
    expect(classical.elements.columns.length).toBeGreaterThan(0);

    const gothic = requireStyle("gothic");
    expect(gothic.elements.buttresses.length).toBeGreaterThan(0);

    const modernist = requireStyle("modernist");
    expect(modernist.elements.arches).toHaveLength(0);
  });
});
