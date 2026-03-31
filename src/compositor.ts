import type {
  Building,
  BuildingConfig,
  ElementInstance,
  ElementType,
  StyleGrammar,
} from "./types.js";
import { requireStyle } from "./styles/index.js";
import { mulberry32 } from "./shared/prng.js";

// ---------------------------------------------------------------------------
// Scale → dimension lookup
// ---------------------------------------------------------------------------

interface ScaleDimensions {
  baseWidth: number;
  baseDepth: number;
  defaultStories: number;
}

const SCALE_DIMS: Record<string, ScaleDimensions> = {
  cottage: { baseWidth: 6, baseDepth: 5, defaultStories: 1 },
  house: { baseWidth: 8, baseDepth: 7, defaultStories: 2 },
  townhouse: { baseWidth: 6, baseDepth: 10, defaultStories: 3 },
  tower: { baseWidth: 10, baseDepth: 10, defaultStories: 8 },
  civic: { baseWidth: 20, baseDepth: 15, defaultStories: 3 },
  monument: { baseWidth: 30, baseDepth: 25, defaultStories: 4 },
  megastructure: { baseWidth: 50, baseDepth: 40, defaultStories: 20 },
};

// ---------------------------------------------------------------------------
// Building compositor
// ---------------------------------------------------------------------------

/**
 * Generate a complete building from a config + style grammar.
 * Places construction elements in world space based on style rules.
 */
export function compositeBuilding(
  config: BuildingConfig,
  positionX: number,
  positionZ: number,
  rotation: number,
): Building {
  const grammar = requireStyle(config.style);
  const rand = mulberry32(config.seed);
  const dims = SCALE_DIMS[config.scale] ?? SCALE_DIMS.house!;

  const stories = config.stories || dims.defaultStories;
  const bays = config.bays || Math.max(2, Math.round(dims.baseWidth / grammar.proportions.bayWidth));
  const storyH = grammar.proportions.storyHeight;
  const bayW = grammar.proportions.bayWidth;

  const buildingWidth = bays * bayW;
  const buildingDepth = buildingWidth / config.footprintRatio;
  const wallHeight = stories * storyH;
  const roofHeight = wallHeight * grammar.proportions.roofHeightRatio;
  const totalHeight = wallHeight + roofHeight + grammar.proportions.baseHeight;

  const elements: ElementInstance[] = [];
  const baseY = 0;

  // Construction state filter: elements below the construction state cutoff are omitted
  const stateThreshold = config.constructionState;

  // --- Base / plinth ---
  if (grammar.proportions.baseHeight > 0 && stateThreshold >= 0.05) {
    elements.push({
      type: "wall-masonry",
      position: { x: positionX, y: baseY, z: positionZ },
      width: buildingWidth + 0.3,
      height: grammar.proportions.baseHeight,
      depth: buildingDepth + 0.3,
      rotation,
      detail: 0.5,
    });
  }

  const wallBaseY = baseY + grammar.proportions.baseHeight;
  const wallDepth = buildingWidth * grammar.proportions.wallThickness;
  // Front face Z — windows/doors must sit at or in front of this
  const frontFaceZ = positionZ + buildingDepth / 2 + wallDepth / 2;

  // --- Walls (one per face) ---
  if (stateThreshold >= 0.15) {
    const wallType = pickRandom(grammar.elements.walls, rand) ?? "wall-masonry";

    // Front wall
    elements.push({
      type: wallType,
      position: {
        x: positionX,
        y: wallBaseY,
        z: positionZ + buildingDepth / 2,
      },
      width: buildingWidth,
      height: wallHeight,
      depth: buildingWidth * grammar.proportions.wallThickness,
      rotation,
      detail: 1,
    });

    // Back wall
    elements.push({
      type: wallType,
      position: {
        x: positionX,
        y: wallBaseY,
        z: positionZ - buildingDepth / 2,
      },
      width: buildingWidth,
      height: wallHeight,
      depth: buildingWidth * grammar.proportions.wallThickness,
      rotation: rotation + Math.PI,
      detail: 0.6,
    });

    // Side walls
    elements.push({
      type: wallType,
      position: {
        x: positionX + buildingWidth / 2,
        y: wallBaseY,
        z: positionZ,
      },
      width: buildingDepth,
      height: wallHeight,
      depth: buildingWidth * grammar.proportions.wallThickness,
      rotation: rotation + Math.PI / 2,
      detail: 0.8,
    });

    elements.push({
      type: wallType,
      position: {
        x: positionX - buildingWidth / 2,
        y: wallBaseY,
        z: positionZ,
      },
      width: buildingDepth,
      height: wallHeight,
      depth: buildingWidth * grammar.proportions.wallThickness,
      rotation: rotation - Math.PI / 2,
      detail: 0.8,
    });
  }

  // --- Columns (if style uses them) ---
  if (grammar.elements.columns.length > 0 && stateThreshold >= 0.2) {
    const colType = pickRandom(grammar.elements.columns, rand)!;
    const colW = bayW * 0.15;
    const colH = wallHeight;

    // Front colonnade
    for (let b = 0; b <= bays; b++) {
      const x = positionX - buildingWidth / 2 + b * bayW;
      elements.push({
        type: colType,
        position: { x, y: wallBaseY, z: positionZ + buildingDepth / 2 + 0.3 },
        width: colW,
        height: colH,
        depth: colW,
        rotation,
        detail: 1,
      });
    }
  }

  // --- Windows ---
  if (grammar.windowTypes.length > 0 && stateThreshold >= 0.35) {
    const winType = pickRandom(grammar.windowTypes, rand)!;
    const winW = bayW * 0.55;
    const winH = storyH * 0.55;

    for (let story = 0; story < stories; story++) {
      const winY = wallBaseY + story * storyH + storyH * 0.3;
      for (let bay = 0; bay < bays; bay++) {
        const winX = positionX - buildingWidth / 2 + (bay + 0.5) * bayW;

        // Front windows — offset forward from wall face to guarantee depth sort
        elements.push({
          type: winType,
          position: { x: winX, y: winY, z: frontFaceZ + 0.08 },
          width: winW,
          height: winH,
          depth: 0.1,
          rotation,
          detail: 1,
        });
      }
    }
  }

  // --- Door (ground floor, center bay) ---
  if (grammar.doorTypes.length > 0 && stateThreshold >= 0.4) {
    const doorType = pickRandom(grammar.doorTypes, rand)!;
    const doorW = bayW * 0.6;
    const doorH = storyH * 0.8;

    elements.push({
      type: doorType,
      position: {
        x: positionX,
        y: wallBaseY,
        z: frontFaceZ + 0.08,
      },
      width: doorW,
      height: doorH,
      depth: 0.15,
      rotation,
      detail: 1,
    });
  }

  // --- Arches above windows (style-defining feature) ---
  if (grammar.elements.arches.length > 0 && stateThreshold >= 0.4) {
    const archType = pickRandom(grammar.elements.arches, rand)!;
    const archW = bayW * 0.6;
    const archH = storyH * 0.35;

    for (let story = 0; story < stories; story++) {
      const archY = wallBaseY + story * storyH + storyH * 0.3 + storyH * 0.5;
      for (let bay = 0; bay < bays; bay++) {
        const archX = positionX - buildingWidth / 2 + (bay + 0.5) * bayW;

        elements.push({
          type: archType,
          position: { x: archX, y: archY, z: frontFaceZ + 0.01 },
          width: archW,
          height: archH,
          depth: 0.1,
          rotation,
          detail: 0.9,
        });
      }
    }
  }

  // --- Decorative elements ---
  if (grammar.decorativeElements.length > 0 && stateThreshold >= 0.45) {
    // Cornice at top of wall
    const decoType = pickRandom(grammar.decorativeElements, rand)!;
    elements.push({
      type: decoType,
      position: {
        x: positionX,
        y: wallBaseY + wallHeight,
        z: positionZ + buildingDepth / 2,
      },
      width: buildingWidth + 0.4,
      height: storyH * 0.12,
      depth: buildingDepth,
      rotation,
      detail: 0.8,
    });

    // String course between floors
    if (stories > 1 && grammar.decorativeElements.includes("string-course")) {
      for (let s = 1; s < stories; s++) {
        elements.push({
          type: "string-course",
          position: {
            x: positionX,
            y: wallBaseY + s * storyH,
            z: positionZ + buildingDepth / 2,
          },
          width: buildingWidth + 0.2,
          height: storyH * 0.05,
          depth: buildingDepth,
          rotation,
          detail: 0.6,
        });
      }
    }
  }

  // --- Buttresses ---
  if (grammar.elements.buttresses.length > 0 && stateThreshold >= 0.25) {
    const buttType = pickRandom(grammar.elements.buttresses, rand)!;
    const buttW = bayW * 0.2;
    const buttD = buildingDepth * 0.15;

    // Every other bay on side walls
    for (let b = 0; b < bays; b += 2) {
      const x = positionX - buildingWidth / 2 + (b + 0.5) * bayW;
      elements.push({
        type: buttType,
        position: { x, y: wallBaseY, z: positionZ - buildingDepth / 2 - buttD / 2 },
        width: buttW,
        height: wallHeight * 0.8,
        depth: buttD,
        rotation: rotation + Math.PI,
        detail: 0.7,
      });
    }
  }

  // --- Roof ---
  if (stateThreshold >= 0.5) {
    const roofType = config.roofForm || pickRandom(grammar.roofForms, rand) || "roof-gable";
    elements.push({
      type: roofType,
      position: {
        x: positionX,
        y: wallBaseY + wallHeight,
        z: positionZ,
      },
      width: buildingWidth + 0.5,
      height: roofHeight,
      depth: buildingDepth + 0.5,
      rotation,
      detail: 0.9,
    });
  }

  return {
    config,
    position: { x: positionX, y: 0, z: positionZ },
    rotation,
    width: buildingWidth,
    height: totalHeight,
    depth: buildingDepth,
    elements,
  };
}

// ---------------------------------------------------------------------------
// Default building config
// ---------------------------------------------------------------------------

/** Create a default building config with sensible values. */
export function defaultBuildingConfig(overrides?: Partial<BuildingConfig>): BuildingConfig {
  return {
    style: overrides?.style ?? "classical",
    scale: overrides?.scale ?? "house",
    stories: overrides?.stories ?? 2,
    bays: overrides?.bays ?? 3,
    footprintRatio: overrides?.footprintRatio ?? 1.5,
    roofForm: overrides?.roofForm ?? "roof-gable",
    massingVariation: overrides?.massingVariation ?? 0,
    constructionState: overrides?.constructionState ?? 0.5,
    weathering: overrides?.weathering ?? 0,
    seed: overrides?.seed ?? Math.floor(Math.random() * 999999),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: readonly T[], rand: () => number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(rand() * arr.length)];
}
