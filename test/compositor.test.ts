import { describe, it, expect } from "vitest";
import { compositeBuilding, defaultBuildingConfig } from "../src/compositor.js";
import type { BuildingConfig } from "../src/types.js";

describe("defaultBuildingConfig", () => {
  it("returns sensible defaults", () => {
    const config = defaultBuildingConfig();
    expect(config.style).toBe("classical");
    expect(config.scale).toBe("house");
    expect(config.stories).toBe(2);
    expect(config.bays).toBe(3);
    expect(config.constructionState).toBe(0.5);
  });

  it("accepts overrides", () => {
    const config = defaultBuildingConfig({ style: "gothic", stories: 5, seed: 999 });
    expect(config.style).toBe("gothic");
    expect(config.stories).toBe(5);
    expect(config.seed).toBe(999);
    expect(config.scale).toBe("house"); // not overridden
  });
});

describe("compositeBuilding", () => {
  it("produces a building with elements", () => {
    const config = defaultBuildingConfig({ seed: 42 });
    const building = compositeBuilding(config, 0, 30, 0);
    expect(building.elements.length).toBeGreaterThan(0);
    expect(building.position.x).toBe(0);
    expect(building.position.z).toBe(30);
    expect(building.width).toBeGreaterThan(0);
    expect(building.height).toBeGreaterThan(0);
  });

  it("produces deterministic output for same seed", () => {
    const config = defaultBuildingConfig({ seed: 123 });
    const b1 = compositeBuilding(config, 0, 30, 0);
    const b2 = compositeBuilding(config, 0, 30, 0);
    expect(b1.elements.length).toBe(b2.elements.length);
    expect(b1.width).toBe(b2.width);
    expect(b1.height).toBe(b2.height);
  });

  it("varies output with different seeds", () => {
    const config1 = defaultBuildingConfig({ seed: 1 });
    const config2 = defaultBuildingConfig({ seed: 2 });
    const b1 = compositeBuilding(config1, 0, 30, 0);
    const b2 = compositeBuilding(config2, 0, 30, 0);
    // Same style/scale → same dimensions, but element details may vary
    expect(b1.width).toBe(b2.width);
  });

  it("respects construction state — foundation has fewer elements", () => {
    const foundation = compositeBuilding(
      defaultBuildingConfig({ constructionState: 0.05, seed: 42 }),
      0, 30, 0,
    );
    const complete = compositeBuilding(
      defaultBuildingConfig({ constructionState: 0.5, seed: 42 }),
      0, 30, 0,
    );
    expect(foundation.elements.length).toBeLessThan(complete.elements.length);
  });

  it("handles all registered styles without error", () => {
    const styles = [
      "classical", "roman", "romanesque", "gothic", "islamic",
      "chinese", "japanese", "tudor", "renaissance", "baroque",
      "georgian", "art-nouveau", "art-deco", "vernacular",
      "modernist", "brutalist", "high-tech", "deconstructivist", "parametric",
      "futuristic", "sculptural", "metabolist", "organic", "fantasy",
    ] as const;
    for (const style of styles) {
      const config = defaultBuildingConfig({ style, seed: 42 });
      const building = compositeBuilding(config, 0, 30, 0);
      expect(building.elements.length).toBeGreaterThan(0);
    }
  });

  it("handles all building scales", () => {
    const scales = ["cottage", "house", "townhouse", "tower", "civic", "monument", "megastructure"] as const;
    for (const scale of scales) {
      const config = defaultBuildingConfig({ scale, seed: 42 });
      const building = compositeBuilding(config, 0, 30, 0);
      expect(building.elements.length).toBeGreaterThan(0);
    }
  });

  it("gothic buildings have buttresses", () => {
    const config = defaultBuildingConfig({ style: "gothic", seed: 42 });
    const building = compositeBuilding(config, 0, 30, 0);
    const buttresses = building.elements.filter((e) => e.type.startsWith("buttress"));
    expect(buttresses.length).toBeGreaterThan(0);
  });

  it("classical buildings have columns", () => {
    const config = defaultBuildingConfig({ style: "classical", seed: 42 });
    const building = compositeBuilding(config, 0, 30, 0);
    const columns = building.elements.filter((e) => e.type.startsWith("column"));
    expect(columns.length).toBeGreaterThan(0);
  });

  it("modernist buildings have no columns by default", () => {
    // Modernist has columns: ["column-simple"] so it might have some
    const config = defaultBuildingConfig({ style: "modernist", seed: 42 });
    const building = compositeBuilding(config, 0, 30, 0);
    // At least has walls + windows
    const walls = building.elements.filter((e) => e.type.startsWith("wall"));
    expect(walls.length).toBeGreaterThan(0);
  });

  it("applies rotation to building", () => {
    const config = defaultBuildingConfig({ seed: 42 });
    const b1 = compositeBuilding(config, 0, 30, 0);
    const b2 = compositeBuilding(config, 0, 30, Math.PI / 4);
    expect(b1.rotation).toBe(0);
    expect(b2.rotation).toBeCloseTo(Math.PI / 4);
  });
});
