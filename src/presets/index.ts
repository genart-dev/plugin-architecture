import type { BuildingConfig, ArchitecturalStyleName } from "../types.js";
import { defaultBuildingConfig } from "../compositor.js";

/** A named building preset. */
export interface BuildingPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly config: BuildingConfig;
}

const presets: BuildingPreset[] = [
  // Classical
  {
    id: "greek-temple",
    name: "Greek Temple",
    description: "Classical temple with Doric columns, pediment, and symmetrical facade.",
    config: defaultBuildingConfig({
      style: "classical", scale: "civic", stories: 1, bays: 6,
      footprintRatio: 2.0, roofForm: "roof-gable", constructionState: 0.5, seed: 100,
    }),
  },
  {
    id: "roman-villa",
    name: "Roman Villa",
    description: "Grand Roman residence with columns and hip roof.",
    config: defaultBuildingConfig({
      style: "classical", scale: "house", stories: 2, bays: 5,
      footprintRatio: 1.8, roofForm: "roof-hip", constructionState: 0.5, seed: 101,
    }),
  },

  // Gothic
  {
    id: "gothic-cathedral",
    name: "Gothic Cathedral",
    description: "Tall Gothic church with flying buttresses, pointed arches, and a spire.",
    config: defaultBuildingConfig({
      style: "gothic", scale: "monument", stories: 4, bays: 5,
      footprintRatio: 2.5, roofForm: "roof-spire", constructionState: 0.5, seed: 200,
    }),
  },
  {
    id: "gothic-chapel",
    name: "Gothic Chapel",
    description: "Small pointed-arch chapel with lancet windows.",
    config: defaultBuildingConfig({
      style: "gothic", scale: "house", stories: 2, bays: 3,
      footprintRatio: 2.0, roofForm: "roof-gable", constructionState: 0.5, seed: 201,
    }),
  },

  // Tudor
  {
    id: "tudor-cottage",
    name: "Tudor Cottage",
    description: "Half-timber cottage with steep gable and small windows.",
    config: defaultBuildingConfig({
      style: "tudor", scale: "cottage", stories: 2, bays: 2,
      footprintRatio: 1.2, roofForm: "roof-gable", constructionState: 0.5, seed: 300,
    }),
  },
  {
    id: "tudor-manor",
    name: "Tudor Manor",
    description: "Large half-timber manor house with multiple gables.",
    config: defaultBuildingConfig({
      style: "tudor", scale: "civic", stories: 3, bays: 5,
      footprintRatio: 1.5, roofForm: "roof-gable", constructionState: 0.5, seed: 301,
    }),
  },

  // Islamic
  {
    id: "mosque",
    name: "Mosque",
    description: "Domed mosque with horseshoe arches and geometric decoration.",
    config: defaultBuildingConfig({
      style: "islamic", scale: "civic", stories: 2, bays: 5,
      footprintRatio: 1.2, roofForm: "roof-dome", constructionState: 0.5, seed: 400,
    }),
  },

  // Modernist
  {
    id: "modernist-villa",
    name: "Modernist Villa",
    description: "Clean-lined modernist house with flat roof, ribbon windows, and pilotis.",
    config: defaultBuildingConfig({
      style: "modernist", scale: "house", stories: 2, bays: 3,
      footprintRatio: 1.8, roofForm: "roof-flat", constructionState: 0.5, seed: 500,
    }),
  },
  {
    id: "modernist-tower",
    name: "Modernist Tower",
    description: "Glass and steel office tower.",
    config: defaultBuildingConfig({
      style: "modernist", scale: "tower", stories: 12, bays: 4,
      footprintRatio: 1.0, roofForm: "roof-flat", constructionState: 0.5, seed: 501,
    }),
  },

  // Brutalist
  {
    id: "brutalist-block",
    name: "Brutalist Block",
    description: "Massive raw concrete residential block with repetitive windows.",
    config: defaultBuildingConfig({
      style: "brutalist", scale: "tower", stories: 8, bays: 6,
      footprintRatio: 2.0, roofForm: "roof-flat", constructionState: 0.5, seed: 600,
    }),
  },

  // Construction states
  {
    id: "ruin",
    name: "Classical Ruin",
    description: "Ruined classical temple — collapsed walls, missing roof.",
    config: defaultBuildingConfig({
      style: "classical", scale: "civic", stories: 1, bays: 4,
      footprintRatio: 2.0, roofForm: "roof-gable", constructionState: 1.0,
      weathering: 0.8, seed: 700,
    }),
  },
  {
    id: "under-construction",
    name: "Under Construction",
    description: "Building in mid-construction — walls up, no windows or roof yet.",
    config: defaultBuildingConfig({
      style: "tudor", scale: "house", stories: 2, bays: 3,
      footprintRatio: 1.3, roofForm: "roof-gable", constructionState: 0.25, seed: 701,
    }),
  },

  // Renaissance + Baroque
  {
    id: "renaissance-palazzo",
    name: "Renaissance Palazzo",
    description: "Symmetrical Renaissance palace with rusticated base and classical proportions.",
    config: defaultBuildingConfig({
      style: "renaissance", scale: "civic", stories: 3, bays: 5,
      footprintRatio: 1.5, roofForm: "roof-hip", constructionState: 0.5, seed: 800,
    }),
  },
  {
    id: "baroque-church",
    name: "Baroque Church",
    description: "Theatrical baroque church with dome and ornate facade.",
    config: defaultBuildingConfig({
      style: "baroque", scale: "monument", stories: 3, bays: 3,
      footprintRatio: 2.0, roofForm: "roof-dome", constructionState: 0.5, seed: 810,
    }),
  },

  // Georgian
  {
    id: "georgian-townhouse",
    name: "Georgian Townhouse",
    description: "Restrained Georgian townhouse with symmetrical sash windows.",
    config: defaultBuildingConfig({
      style: "georgian", scale: "townhouse", stories: 4, bays: 3,
      footprintRatio: 0.8, roofForm: "roof-hip", constructionState: 0.5, seed: 820,
    }),
  },

  // Art Deco
  {
    id: "art-deco-skyscraper",
    name: "Art Deco Skyscraper",
    description: "Stepped-back Art Deco tower with geometric ornament.",
    config: defaultBuildingConfig({
      style: "art-deco", scale: "tower", stories: 15, bays: 4,
      footprintRatio: 1.0, roofForm: "roof-spire", constructionState: 0.5, seed: 830,
    }),
  },

  // Japanese
  {
    id: "japanese-teahouse",
    name: "Japanese Teahouse",
    description: "Low, open teahouse with hip roof and timber frame.",
    config: defaultBuildingConfig({
      style: "japanese", scale: "cottage", stories: 1, bays: 3,
      footprintRatio: 1.5, roofForm: "roof-hip", constructionState: 0.5, seed: 840,
    }),
  },

  // Chinese
  {
    id: "chinese-pagoda",
    name: "Chinese Pagoda",
    description: "Multi-story Chinese tower with curved eaves and red trim.",
    config: defaultBuildingConfig({
      style: "chinese", scale: "tower", stories: 5, bays: 3,
      footprintRatio: 1.0, roofForm: "roof-hip", constructionState: 0.5, seed: 850,
    }),
  },

  // High-tech
  {
    id: "high-tech-pavilion",
    name: "High-Tech Pavilion",
    description: "Transparent glass and steel pavilion with exposed structure.",
    config: defaultBuildingConfig({
      style: "high-tech", scale: "civic", stories: 2, bays: 4,
      footprintRatio: 2.0, roofForm: "roof-barrel-vault", constructionState: 0.5, seed: 860,
    }),
  },

  // Fantasy
  {
    id: "fantasy-tower",
    name: "Fantasy Tower",
    description: "Impossible fairytale tower with spires, rose windows, and flying buttresses.",
    config: defaultBuildingConfig({
      style: "fantasy", scale: "tower", stories: 6, bays: 3,
      footprintRatio: 0.8, roofForm: "roof-spire", constructionState: 0.5, seed: 870,
    }),
  },

  // Vernacular
  {
    id: "rustic-farmhouse",
    name: "Rustic Farmhouse",
    description: "Simple stone farmhouse with gable roof.",
    config: defaultBuildingConfig({
      style: "vernacular", scale: "house", stories: 2, bays: 3,
      footprintRatio: 1.5, roofForm: "roof-gable", constructionState: 0.5, seed: 880,
    }),
  },
];

/** All building presets. */
export const ALL_PRESETS: readonly BuildingPreset[] = presets;

/** Get a preset by ID. */
export function getPreset(id: string): BuildingPreset | undefined {
  return presets.find((p) => p.id === id);
}

/** Filter presets by style. */
export function filterPresets(style?: ArchitecturalStyleName): BuildingPreset[] {
  if (!style) return [...presets];
  return presets.filter((p) => p.config.style === style);
}

/** Search presets by keyword in name or description. */
export function searchPresets(query: string): BuildingPreset[] {
  const q = query.toLowerCase();
  return presets.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
}
