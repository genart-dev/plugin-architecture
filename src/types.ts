import type { Vec3 } from "@genart-dev/projection";

// ---------------------------------------------------------------------------
// Architectural Style Names
// ---------------------------------------------------------------------------

/** Historical architectural styles (14). */
export type HistoricalStyle =
  | "classical"
  | "roman"
  | "romanesque"
  | "gothic"
  | "islamic"
  | "chinese"
  | "japanese"
  | "tudor"
  | "renaissance"
  | "baroque"
  | "georgian"
  | "art-nouveau"
  | "art-deco"
  | "vernacular";

/** Modern architectural styles (5). */
export type ModernStyle =
  | "modernist"
  | "brutalist"
  | "high-tech"
  | "deconstructivist"
  | "parametric";

/** Experimental / artistic styles (5). */
export type ExperimentalStyle =
  | "futuristic"
  | "sculptural"
  | "metabolist"
  | "organic"
  | "fantasy";

/** All supported architectural style names. */
export type ArchitecturalStyleName =
  | HistoricalStyle
  | ModernStyle
  | ExperimentalStyle;

// ---------------------------------------------------------------------------
// Construction Elements
// ---------------------------------------------------------------------------

/** Categories of construction elements. */
export type ElementCategory =
  | "structural"
  | "opening"
  | "roof"
  | "decorative"
  | "modern";

/** Individual element type identifiers. */
export type ElementType =
  // Structural
  | "column-doric"
  | "column-ionic"
  | "column-corinthian"
  | "column-simple"
  | "pilaster"
  | "arch-round"
  | "arch-pointed"
  | "arch-horseshoe"
  | "arch-ogee"
  | "arch-lancet"
  | "arch-trefoil"
  | "arch-parabolic"
  | "beam-timber"
  | "beam-stone"
  | "beam-steel"
  | "buttress-flat"
  | "buttress-stepped"
  | "buttress-flying"
  | "wall-masonry"
  | "wall-curtain"
  | "wall-timber-frame"
  | "wall-glass"
  // Openings
  | "window-single"
  | "window-paired"
  | "window-arched"
  | "window-rose"
  | "window-lancet"
  | "window-dormer"
  | "window-ribbon"
  | "window-oculus"
  | "door-simple"
  | "door-arched"
  | "door-double"
  | "door-portal"
  | "balcony-juliet"
  | "balcony-cantilevered"
  | "gallery-arcade"
  | "gallery-colonnade"
  // Roofs
  | "roof-gable"
  | "roof-hip"
  | "roof-mansard"
  | "roof-dome"
  | "roof-barrel-vault"
  | "roof-pagoda"
  | "roof-onion"
  | "roof-spire"
  | "roof-flat"
  | "roof-tensile"
  // Decorative
  | "cornice"
  | "frieze"
  | "string-course"
  | "quoins"
  | "rustication"
  | "tracery"
  | "timber-framing"
  | "zellige"
  | "mashrabiya"
  // Modern
  | "diagrid"
  | "space-frame"
  | "exoskeleton"
  | "glass-curtain-wall"
  | "parametric-panel"
  | "cantilever"
  | "twist"
  | "void-cutout";

// ---------------------------------------------------------------------------
// Element Definition
// ---------------------------------------------------------------------------

/** A 2D quad in world space representing one face of a building element. */
export interface WorldQuad {
  /** Four corners in world-space, wound counter-clockwise when viewed from outside. */
  readonly corners: readonly [Vec3, Vec3, Vec3, Vec3];
  /** Outward-facing normal. */
  readonly normal: Vec3;
}

/** Screen-space projected quad ready for 2D rendering. */
export interface ScreenQuad {
  /** Four screen-space corners (x, y). */
  readonly corners: readonly [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
  ];
  /** Normalized depth (0 = near, 1 = far) — average of corner depths. */
  readonly depth: number;
  /** Screen-space scale factor — pixels per world unit at this depth. */
  readonly scale: number;
  /** Whether the quad is visible (not culled or back-facing). */
  readonly visible: boolean;
}

/** A construction element instance placed in world space. */
export interface ElementInstance {
  /** Element type identifier. */
  readonly type: ElementType;
  /** World-space position (base center). */
  readonly position: Vec3;
  /** Width in world units. */
  readonly width: number;
  /** Height in world units. */
  readonly height: number;
  /** Depth in world units (for 3D elements). */
  readonly depth: number;
  /** Y-axis rotation in radians (0 = facing +Z). */
  readonly rotation: number;
  /** Detail level 0-1 (reduced with distance). */
  readonly detail: number;
}

/** Rendering instructions for a single element, produced by an element renderer. */
export interface ElementRenderResult {
  /** World-space quads for 3D projection. */
  readonly quads: WorldQuad[];
  /** 2D drawing commands executed after projection. */
  readonly draw: (
    ctx: CanvasRenderingContext2D,
    projected: ScreenQuad[],
    style: RenderStyle,
  ) => void;
}

// ---------------------------------------------------------------------------
// Edge Classification (Phase 1: line weight hierarchy)
// ---------------------------------------------------------------------------

/** Edge classification for line weight hierarchy. */
export type EdgeClass = "silhouette" | "fold" | "detail" | "ground";

/** Weight multipliers per edge class — silhouette and ground dominate. */
export const EDGE_WEIGHTS: Readonly<Record<EdgeClass, number>> = {
  silhouette: 2.5,
  fold: 1.0,
  detail: 0.5,
  ground: 3.0,
};

/** Screen-space projected quad with edge classification. */
export interface ClassifiedScreenQuad extends ScreenQuad {
  /** Classification for each of the 4 edges (edge i = corner[i]→corner[(i+1)%4]). */
  readonly edgeClasses: readonly [EdgeClass, EdgeClass, EdgeClass, EdgeClass];
  /** Projected surface normal angle in radians (0 = right, π/2 = up). Used for hatching direction. */
  readonly screenNormalAngle: number;
}

/** Face lighting classification derived from light dot product. */
export type FaceLighting = "lit" | "ambient" | "shadow";

// ---------------------------------------------------------------------------
// Render Mode
// ---------------------------------------------------------------------------

/** Illustration rendering mode for architecture. */
export type RenderMode =
  | "filled"     // Classic canvas2d fill+stroke (v0.1 default)
  | "pencil"     // Multi-pass graphite sketch
  | "ink"        // Confident ink lines with variation
  | "technical"  // Precise, uniform architectural drawing
  | "engraving"  // Crosshatch engraving
  | "woodcut";   // Bold gouged lines

// ---------------------------------------------------------------------------
// Render Style (passed to element draw functions)
// ---------------------------------------------------------------------------

/** Visual rendering parameters derived from style grammar + depth. */
export interface RenderStyle {
  /** Base stroke color (hex). */
  readonly strokeColor: string;
  /** Base fill color (hex). */
  readonly fillColor: string;
  /** Stroke weight in pixels (already scaled for depth). */
  readonly strokeWeight: number;
  /** Opacity 0-1 (reduced by atmosphere/distance). */
  readonly opacity: number;
  /** Detail level 0-1. */
  readonly detail: number;
  /** Whether to draw structural lines only (wireframe mode). */
  readonly wireframe: boolean;
  /** Illustration render mode. Default: "filled". */
  readonly renderMode?: RenderMode;
  /** Face lighting classification. Default: "ambient". */
  readonly lighting?: FaceLighting;
}

// ---------------------------------------------------------------------------
// Building Model
// ---------------------------------------------------------------------------

/** Scale categories for buildings. */
export type BuildingScale =
  | "cottage"
  | "house"
  | "townhouse"
  | "tower"
  | "civic"
  | "monument"
  | "megastructure";

/** Building configuration — the generative model for one building. */
export interface BuildingConfig {
  /** Architectural style. */
  readonly style: ArchitecturalStyleName;
  /** Building scale category. */
  readonly scale: BuildingScale;
  /** Number of stories (1-50+). */
  readonly stories: number;
  /** Number of bays (horizontal rhythm units). */
  readonly bays: number;
  /** Width-to-depth ratio (1 = square, 2 = double width). */
  readonly footprintRatio: number;
  /** Roof form (from element types). */
  readonly roofForm: ElementType;
  /** Massing variation: 0 = pure box, 1 = max deformation. */
  readonly massingVariation: number;
  /** Construction state: 0 = foundation, 0.5 = complete, 1.0 = ruin. */
  readonly constructionState: number;
  /** Weathering: 0 = pristine, 1 = ancient. */
  readonly weathering: number;
  /** PRNG seed for deterministic generation. */
  readonly seed: number;
}

/** A fully resolved building ready for rendering. */
export interface Building {
  /** The config that generated this building. */
  readonly config: BuildingConfig;
  /** World-space position (ground-center). */
  readonly position: Vec3;
  /** Y-axis rotation in radians. */
  readonly rotation: number;
  /** Computed width in world units. */
  readonly width: number;
  /** Computed height in world units. */
  readonly height: number;
  /** Computed depth in world units. */
  readonly depth: number;
  /** All construction elements composing this building. */
  readonly elements: ElementInstance[];
}

// ---------------------------------------------------------------------------
// Style Grammar
// ---------------------------------------------------------------------------

/** Proportion rules for a building style. */
export interface StyleProportions {
  /** Typical story height in world units. */
  readonly storyHeight: number;
  /** Bay width in world units. */
  readonly bayWidth: number;
  /** Wall thickness as fraction of bay width. */
  readonly wallThickness: number;
  /** Roof height as fraction of building height. */
  readonly roofHeightRatio: number;
  /** Base/plinth height in world units (0 = no base). */
  readonly baseHeight: number;
}

/** Color palette for a style. */
export interface StylePalette {
  /** Primary wall color (hex). */
  readonly wall: string;
  /** Roof color (hex). */
  readonly roof: string;
  /** Trim/accent color (hex). */
  readonly trim: string;
  /** Window/opening fill color (hex). */
  readonly opening: string;
  /** Structural element color (hex). */
  readonly structure: string;
  /** Stroke/outline color (hex). */
  readonly stroke: string;
}

/** A style grammar defines how a building is composed from elements. */
export interface StyleGrammar {
  /** Style identifier. */
  readonly id: ArchitecturalStyleName;
  /** Human-readable name. */
  readonly name: string;
  /** Brief description of visual character. */
  readonly character: string;
  /** Proportion rules. */
  readonly proportions: StyleProportions;
  /** Color palette. */
  readonly palette: StylePalette;
  /** Preferred element types for each zone. */
  readonly elements: StyleElementPalette;
  /** Preferred roof forms, in order of preference. */
  readonly roofForms: ElementType[];
  /** Preferred window types. */
  readonly windowTypes: ElementType[];
  /** Preferred door types. */
  readonly doorTypes: ElementType[];
  /** Preferred decorative elements. */
  readonly decorativeElements: ElementType[];
}

/** Element selection rules per building zone. */
export interface StyleElementPalette {
  /** Column types for this style (empty = no columns). */
  readonly columns: ElementType[];
  /** Arch types (empty = use lintels). */
  readonly arches: ElementType[];
  /** Wall types. */
  readonly walls: ElementType[];
  /** Buttress types (empty = no buttresses). */
  readonly buttresses: ElementType[];
}
