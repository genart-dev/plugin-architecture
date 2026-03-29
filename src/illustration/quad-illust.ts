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
import type { ScreenQuad, RenderStyle, RenderMode } from "../types.js";
import { getStrategy } from "./strategies.js";
import { drawMarks } from "./draw-marks.js";

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
 */
function edgeToProfile(a: Point2D, b: Point2D, weight: number): StrokeProfile {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Sample along the edge for multi-point profile (required by pencil strategy)
  const steps = Math.max(2, Math.ceil(len / 8));
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: a.x + dx * t,
      y: a.y + dy * t,
      width: weight,
      pressure: 0.6 + 0.4 * Math.sin(t * Math.PI), // lighter at ends
    });
  }
  return { points, taper: { start: weight * 0.5, end: weight * 0.5 } };
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

  // ── Fill interior with illustration fill strategy ──
  if (!style.wireframe) {
    const fillConfig: FillConfig = {
      density: 0.3 + style.detail * 0.4,
      weight: Math.max(0.3, style.strokeWeight * 0.35),
      angle: Math.PI / 4 + rng() * 0.3, // slight angle variation
      jitter: 0.15,
      gradient: {
        angle: Math.PI / 2, // top-to-bottom density
        strength: 0.3,
      },
    };

    const fillMarks = strategy.fill.generateFill(pts, fillConfig, rng);
    drawMarks(ctx, fillMarks, style.fillColor, style.opacity * 0.5);
  }

  // ── Stroke edges with illustration mark strategy ──
  const markConfig: MarkConfig = {
    density: 0.5 + style.detail * 0.3,
    weight: style.strokeWeight,
    jitter: mode === "technical" ? 0 : 0.3,
    passes: mode === "pencil" ? 3 : 1,
  };

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;

    const profile = edgeToProfile(a, b, style.strokeWeight);
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

  // ── Fill with directed hatching ──
  if (!style.wireframe) {
    const fillConfig: FillConfig = {
      density: 0.2 + hatchDensity * 0.08 * style.detail,
      weight: Math.max(0.3, style.strokeWeight * 0.3),
      angle: hatchAngle,
      jitter: 0.1,
    };

    const fillMarks = strategy.fill.generateFill(pts, fillConfig, rng);
    drawMarks(ctx, fillMarks, style.fillColor, style.opacity * 0.4);
  }

  // ── Stroke edges ──
  const markConfig: MarkConfig = {
    density: 0.6,
    weight: style.strokeWeight,
    jitter: mode === "technical" ? 0 : 0.25,
    passes: mode === "pencil" ? 3 : 1,
  };

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;

    const profile = edgeToProfile(a, b, style.strokeWeight);
    const outline = generateStrokeOutline(profile);
    if (!outline) continue;

    const marks = strategy.mark.generateMarks(outline, profile, markConfig, rng);
    drawMarks(ctx, marks, style.strokeColor, style.opacity);
  }
}
