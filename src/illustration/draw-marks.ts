/**
 * Render illustration Mark[] to a CanvasRenderingContext2D.
 *
 * This is the bridge between illustration's data model (Mark objects)
 * and the canvas output that architecture's rendering pipeline uses.
 */

import type { Mark } from "@genart-dev/illustration";

/**
 * Draw an array of marks to the canvas context.
 * Each mark is a polyline with width and opacity.
 */
export function drawMarks(
  ctx: CanvasRenderingContext2D,
  marks: Mark[],
  color: string,
  baseOpacity: number,
): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const mark of marks) {
    if (mark.points.length < 2) continue;

    ctx.globalAlpha = baseOpacity * mark.opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = mark.width;

    ctx.beginPath();
    ctx.moveTo(mark.points[0]!.x, mark.points[0]!.y);
    for (let i = 1; i < mark.points.length; i++) {
      ctx.lineTo(mark.points[i]!.x, mark.points[i]!.y);
    }
    ctx.stroke();
  }
}
