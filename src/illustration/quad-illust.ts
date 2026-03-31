/**
 * Illustration-mode drawing for projected quads.
 *
 * Replaces the Canvas2D fill+stroke calls in renderer.ts with
 * illustration MarkStrategy / FillStrategy output for hand-drawn
 * architectural rendering.
 */

import type {
  Point2D,
  StrokeProfile,
  StrokeOutline,
  MarkConfig,
  FillConfig,
} from "@genart-dev/illustration";
import {
  generateStrokeOutline,
} from "@genart-dev/illustration";
import type { ScreenQuad, ClassifiedScreenQuad, RenderStyle, RenderMode } from "../types.js";
import { EDGE_WEIGHTS } from "../types.js";
import { getStrategy } from "./strategies.js";
import { drawMarks } from "./draw-marks.js";

/** Check if a ScreenQuad is a ClassifiedScreenQuad (has edge classes). */
function isClassified(quad: ScreenQuad): quad is ClassifiedScreenQuad {
  return "edgeClasses" in quad;
}

/**
 * Collect unique corners from a quad (handles degenerate triangles).
 */
function uniqueCorners(quad: ScreenQuad): Point2D[] {
  const c = quad.corners;
  const pts: Point2D[] = [{ x: c[0].x, y: c[0].y }];

  const same = (a: Point2D, b: Point2D) =>
    Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5;

  if (!same(c[1], c[0])) pts.push({ x: c[1].x, y: c[1].y });
  if (!same(c[2], pts[pts.length - 1]!)) pts.push({ x: c[2].x, y: c[2].y });
  if (!same(c[3], pts[pts.length - 1]!) && !same(c[3], pts[0]!))
    pts.push({ x: c[3].x, y: c[3].y });

  return pts;
}

/**
 * Build a StrokeProfile from two consecutive points (one edge of a quad).
 * `mode` controls pressure curve and taper to make render modes visually distinct.
 */
function edgeToProfile(
  a: Point2D,
  b: Point2D,
  weight: number,
  mode: Exclude<RenderMode, "filled"> = "pencil",
): StrokeProfile {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Finer sampling (3px) gives strategies enough points for distinct character
  const steps = Math.max(4, Math.ceil(len / 3));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Mode-specific pressure curves
    let pressure: number;
    switch (mode) {
      case "pencil":
        // Multi-pass feel: uneven, lighter at ends, heavier in middle
        pressure = 0.4 + 0.5 * Math.sin(t * Math.PI) + 0.1 * Math.sin(t * Math.PI * 3);
        break;
      case "ink":
        // Confident: heavy throughout, slight taper at start only
        pressure = t < 0.15 ? 0.5 + t * 3.3 : 1.0;
        break;
      case "technical":
        // Uniform pressure — precise mechanical lines
        pressure = 0.85;
        break;
      case "engraving":
        // Swelling line: thin→thick→thin
        pressure = 0.3 + 0.7 * Math.sin(t * Math.PI);
        break;
      case "woodcut":
        // Bold, high pressure with stepped plateaus
        pressure = 0.7 + 0.3 * Math.round(Math.sin(t * Math.PI) * 3) / 3;
        break;
      default:
        pressure = 0.6 + 0.4 * Math.sin(t * Math.PI);
    }
    points.push({
      x: a.x + dx * t,
      y: a.y + dy * t,
      width: weight,
      pressure,
    });
  }

  // Mode-specific taper
  const taper = mode === "technical"
    ? { start: 0, end: 0 }
    : mode === "woodcut"
      ? { start: weight * 0.2, end: weight * 0.2 }
      : { start: weight * 0.5, end: weight * 0.5 };

  return { points, taper };
}

/**
 * Draw a projected quad using illustration mark and fill strategies.
 */
export function drawQuadIllustrated(
  ctx: CanvasRenderingContext2D,
  quad: ScreenQuad,
  style: RenderStyle,
  rng: () => number,
): void {
  if (!quad.visible) return;

  const mode = style.renderMode ?? "pencil";
  if (mode === "filled") return; // caller should use plain drawQuad

  const pts = uniqueCorners(quad);
  if (pts.length < 3) return;

  const strategy = getStrategy(mode as Exclude<RenderMode, "filled">);

  // ── Mode-specific fill approach ──
  // Each mode uses a fundamentally different fill strategy to be visually distinct.
  if (!style.wireframe) {
    const clipPath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
      ctx.closePath();
    };

    switch (mode) {
      case "pencil": {
        // Solid base fill — walls must read as opaque surfaces, not glass
        clipPath();
        ctx.globalAlpha = style.opacity * 0.92;
        ctx.fillStyle = style.fillColor;
        ctx.fill();

        const fillConfig: FillConfig = {
          density: 0.5 + style.detail * 0.5,
          weight: Math.max(0.5, style.strokeWeight * 0.4),
          angle: Math.PI / 4 + rng() * 0.3,
          jitter: 0.2,
          gradient: { angle: Math.PI / 2, strength: 0.4 },
        };
        const fillMarks = strategy.fill.generateFill(pts, fillConfig, rng);
        drawMarks(ctx, fillMarks, style.strokeColor, style.opacity * 0.25);
        break;
      }
      case "ink": {
        // Bold wash fill — fully opaque base, marks add texture on top
        clipPath();
        ctx.globalAlpha = style.opacity * 0.95;
        ctx.fillStyle = style.fillColor;
        ctx.fill();

        // Wash texture — sparse marks for ink wash feel
        const washConfig: FillConfig = {
          density: 0.3,
          weight: Math.max(0.8, style.strokeWeight * 0.6),
          angle: Math.PI / 6,
          jitter: 0.3,
        };
        const washMarks = strategy.fill.generateFill(pts, washConfig, rng);
        drawMarks(ctx, washMarks, style.strokeColor, style.opacity * 0.2);
        break;
      }
      case "technical": {
        // NO fill — pure line drawing. Just a very faint base for occlusion.
        clipPath();
        ctx.globalAlpha = style.opacity * 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        break;
      }
      case "engraving": {
        // Solid base fill + dense cross-hatching defines tonal form
        clipPath();
        ctx.globalAlpha = style.opacity * 0.85;
        ctx.fillStyle = style.fillColor;
        ctx.fill();

        // Primary hatching direction
        const hatchConfig1: FillConfig = {
          density: 0.7 + style.detail * 0.3,
          weight: Math.max(0.4, style.strokeWeight * 0.35),
          angle: Math.PI / 4 + rng() * 0.15,
          jitter: 0.05,
        };
        const hatchMarks1 = strategy.fill.generateFill(pts, hatchConfig1, rng);
        drawMarks(ctx, hatchMarks1, style.strokeColor, style.opacity * 0.5);

        // Cross-hatching (perpendicular)
        const hatchConfig2: FillConfig = {
          density: 0.4 + style.detail * 0.3,
          weight: Math.max(0.3, style.strokeWeight * 0.3),
          angle: -Math.PI / 4 + rng() * 0.15,
          jitter: 0.05,
        };
        const hatchMarks2 = strategy.fill.generateFill(pts, hatchConfig2, rng);
        drawMarks(ctx, hatchMarks2, style.strokeColor, style.opacity * 0.35);
        break;
      }
      case "woodcut": {
        // Bold, high-opacity fills — strong black/white contrast
        clipPath();
        ctx.globalAlpha = style.opacity * 0.9;
        ctx.fillStyle = style.fillColor;
        ctx.fill();
        break;
      }
      default: {
        // Fallback: standard fill
        clipPath();
        ctx.globalAlpha = style.opacity * 0.7;
        ctx.fillStyle = style.fillColor;
        ctx.fill();
      }
    }
  }

  // ── Stroke edges with illustration mark strategy ──
  // Apply edge weight multipliers from classification
  const classified = isClassified(quad);
  const modeKey = mode as Exclude<RenderMode, "filled">;
  const baseWeight = mode === "woodcut" ? style.strokeWeight * 2.2
    : mode === "ink" ? style.strokeWeight * 1.4
    : style.strokeWeight;

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;

    // Edge weight varies by classification
    const edgeMultiplier = classified ? EDGE_WEIGHTS[quad.edgeClasses[(i % 4) as 0 | 1 | 2 | 3]] : 1.0;
    const edgeWeight = baseWeight * edgeMultiplier;

    const markConfig: MarkConfig = {
      density: mode === "engraving" ? 0.8 : mode === "woodcut" ? 0.5 : 0.5 + style.detail * 0.3,
      weight: edgeWeight,
      jitter: mode === "technical" ? 0 : mode === "ink" ? 0.12 : mode === "woodcut" ? 0.04 : 0.25,
      passes: mode === "pencil" ? 3 : mode === "engraving" ? 2 : 1,
    };

    const profile = edgeToProfile(a, b, edgeWeight, modeKey);
    const outline = generateStrokeOutline(profile);
    if (!outline) continue;

    const marks = strategy.mark.generateMarks(outline, profile, markConfig, rng);
    drawMarks(ctx, marks, style.strokeColor, style.opacity);
  }
}

/**
 * Draw a projected quad with illustration hatching fill.
 * Replaces drawQuadWithHatching for illustration modes.
 */
export function drawQuadWithHatchingIllustrated(
  ctx: CanvasRenderingContext2D,
  quad: ScreenQuad,
  style: RenderStyle,
  rng: () => number,
  hatchAngle: number,
  hatchDensity: number,
): void {
  if (!quad.visible) return;

  const mode = style.renderMode ?? "pencil";
  if (mode === "filled") return;

  const pts = uniqueCorners(quad);
  if (pts.length < 3) return;

  const strategy = getStrategy(mode as Exclude<RenderMode, "filled">);

  // ── Mode-specific fill for hatched quads ──
  if (!style.wireframe) {
    const clipPath = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
      ctx.closePath();
    };

    // Base occlusion fill — walls must be solid, not transparent
    const baseOpacity = mode === "technical" ? 0.15
      : mode === "engraving" ? 0.85
      : mode === "woodcut" ? 0.95
      : mode === "ink" ? 0.95
      : 0.92; // pencil
    clipPath();
    ctx.globalAlpha = style.opacity * baseOpacity;
    ctx.fillStyle = mode === "technical" ? "#ffffff" : style.fillColor;
    ctx.fill();

    // Hatching texture on top (skip for woodcut — solid fill is enough)
    if (mode !== "woodcut" && mode !== "technical") {
      const fillConfig: FillConfig = {
        density: 0.3 + hatchDensity * 0.08 * style.detail,
        weight: Math.max(0.5, style.strokeWeight * 0.45),
        angle: hatchAngle,
        jitter: 0.1,
      };

      const hatchOpacity = mode === "engraving" ? 0.5 : mode === "ink" ? 0.25 : 0.3;
      const fillMarks = strategy.fill.generateFill(pts, fillConfig, rng);
      drawMarks(ctx, fillMarks, style.strokeColor, style.opacity * hatchOpacity);
    }
  }

  // ── Stroke edges ──
  const classified = isClassified(quad);
  const modeKey = mode as Exclude<RenderMode, "filled">;
  const baseWeight = mode === "woodcut" ? style.strokeWeight * 2.2
    : mode === "ink" ? style.strokeWeight * 1.4
    : style.strokeWeight;

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;

    const edgeMultiplier = classified ? EDGE_WEIGHTS[quad.edgeClasses[(i % 4) as 0 | 1 | 2 | 3]] : 1.0;
    const edgeWeight = baseWeight * edgeMultiplier;

    const markConfig: MarkConfig = {
      density: mode === "engraving" ? 0.8 : mode === "woodcut" ? 0.5 : 0.6,
      weight: edgeWeight,
      jitter: mode === "technical" ? 0 : mode === "ink" ? 0.12 : mode === "woodcut" ? 0.04 : 0.25,
      passes: mode === "pencil" ? 3 : mode === "engraving" ? 2 : 1,
    };

    const profile = edgeToProfile(a, b, edgeWeight, modeKey);
    const outline = generateStrokeOutline(profile);
    if (!outline) continue;

    const marks = strategy.mark.generateMarks(outline, profile, markConfig, rng);
    drawMarks(ctx, marks, style.strokeColor, style.opacity);
  }
}
