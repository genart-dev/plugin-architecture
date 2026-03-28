import { describe, it, expect } from "vitest";
import type {
  ArchitecturalStyleName,
  ElementType,
  BuildingConfig,
  WorldQuad,
  ScreenQuad,
  RenderStyle,
} from "../src/types.js";

describe("types", () => {
  it("ArchitecturalStyleName includes historical, modern, and experimental", () => {
    const historical: ArchitecturalStyleName = "classical";
    const modern: ArchitecturalStyleName = "modernist";
    const experimental: ArchitecturalStyleName = "futuristic";
    expect(historical).toBe("classical");
    expect(modern).toBe("modernist");
    expect(experimental).toBe("futuristic");
  });

  it("ElementType covers all categories", () => {
    const structural: ElementType = "column-doric";
    const opening: ElementType = "window-rose";
    const roof: ElementType = "roof-dome";
    const decorative: ElementType = "tracery";
    const modern: ElementType = "diagrid";
    expect(structural).toBe("column-doric");
    expect(opening).toBe("window-rose");
    expect(roof).toBe("roof-dome");
    expect(decorative).toBe("tracery");
    expect(modern).toBe("diagrid");
  });
});
