/**
 * Resolve illustration mark and fill strategies from a RenderMode.
 */

import type { MarkStrategy, FillStrategy } from "@genart-dev/illustration";
import {
  pencilMark,
  inkMark,
  technicalMark,
  engravingMark,
  woodcutMark,
  hatchFill,
  crosshatchFill,
  stippleFill,
} from "@genart-dev/illustration";
import type { RenderMode } from "../types.js";

export interface IllustrationStrategy {
  mark: MarkStrategy;
  fill: FillStrategy;
}

const STRATEGIES: Record<Exclude<RenderMode, "filled">, IllustrationStrategy> = {
  pencil: { mark: pencilMark, fill: hatchFill },
  ink: { mark: inkMark, fill: hatchFill },
  technical: { mark: technicalMark, fill: hatchFill },
  engraving: { mark: engravingMark, fill: crosshatchFill },
  woodcut: { mark: woodcutMark, fill: stippleFill },
};

export function getStrategy(mode: Exclude<RenderMode, "filled">): IllustrationStrategy {
  return STRATEGIES[mode];
}
