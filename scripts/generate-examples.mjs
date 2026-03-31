#!/usr/bin/env node
/**
 * Generate example .genart files for plugin-architecture.
 * Each example: one building, filled mode, properly framed camera, horizon line.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "examples");

// Horizon line + sky/ground split algorithm
const algo = (skyColor = "#f0ece6", groundColor = "#e0dbd4") =>
  `function sketch(ctx, state) { var w=state.canvas.width, h=state.canvas.height, hz=h*0.55; ctx.fillStyle='${skyColor}'; ctx.fillRect(0,0,w,hz); ctx.fillStyle='${groundColor}'; ctx.fillRect(0,hz,w,h-hz); ctx.strokeStyle='#b0a898'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,hz); ctx.lineTo(w,hz); ctx.stroke(); }`;

// Camera that frames a building well.
// buildingZ = how far away, cameraY = eye height, targetY = look-at height
function camera(w, h, { buildingZ = 20, cameraY = 2, targetY = 4, fov = 50 } = {}) {
  return {
    id: "camera-01",
    type: "perspective:camera",
    name: "Camera",
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { x: 0, y: 0, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0 },
    properties: {
      preset: "custom",
      positionX: 0,
      positionY: cameraY,
      positionZ: 0,
      targetX: 0,
      targetY: targetY,
      targetZ: buildingZ,
      fov,
      projectionType: "perspective",
      near: 0.1,
      far: 200,
      orthoScale: 100,
    },
  };
}

function building(name, props, w, h) {
  return {
    id: "building-01",
    type: "architecture:building",
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { x: 0, y: 0, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0 },
    properties: {
      renderMode: "filled",
      wireframe: false,
      constructionState: 0.8,
      massingVariation: 0,
      weathering: 0,
      ...props,
    },
  };
}

function genart(id, title, w, h, layers, algoStr) {
  return {
    genart: "1.1",
    id,
    title,
    created: "2026-03-31T00:00:00Z",
    modified: "2026-03-31T00:00:00Z",
    renderer: { type: "canvas2d" },
    canvas: { width: w, height: h },
    parameters: [],
    colors: [],
    state: { seed: 42, params: {}, colorPalette: [] },
    algorithm: algoStr,
    layers,
  };
}

// -------------------------------------------------------------------
// Single-building examples — each style at a size that fills the frame
// -------------------------------------------------------------------

const W = 800, H = 800;

const singles = [
  {
    id: "classical",
    title: "Classical — House",
    cam: { buildingZ: 18, cameraY: 2, targetY: 4, fov: 50 },
    props: { architecturalStyle: "classical", buildingScale: "house", stories: 2, bays: 3, footprintRatio: 1.5, roofForm: "roof-gable", positionX: 0, positionZ: 18, rotationDeg: 25, seed: 100 },
  },
  {
    id: "gothic",
    title: "Gothic — Townhouse",
    cam: { buildingZ: 28, cameraY: 2, targetY: 8, fov: 50 },
    props: { architecturalStyle: "gothic", buildingScale: "townhouse", stories: 3, bays: 3, footprintRatio: 1.8, roofForm: "roof-spire", positionX: 0, positionZ: 28, rotationDeg: 20, seed: 200 },
  },
  {
    id: "tudor",
    title: "Tudor — House",
    cam: { buildingZ: 16, cameraY: 2, targetY: 3.5, fov: 50 },
    props: { architecturalStyle: "tudor", buildingScale: "house", stories: 2, bays: 3, footprintRatio: 1.3, roofForm: "roof-gable", positionX: 0, positionZ: 16, rotationDeg: 30, seed: 300 },
  },
  {
    id: "islamic",
    title: "Islamic — House",
    cam: { buildingZ: 20, cameraY: 2, targetY: 5, fov: 50 },
    props: { architecturalStyle: "islamic", buildingScale: "house", stories: 2, bays: 3, footprintRatio: 1.2, roofForm: "roof-dome", positionX: 0, positionZ: 20, rotationDeg: -20, seed: 400 },
  },
  {
    id: "japanese",
    title: "Japanese — House",
    cam: { buildingZ: 18, cameraY: 2, targetY: 4, fov: 50 },
    props: { architecturalStyle: "japanese", buildingScale: "house", stories: 2, bays: 3, footprintRatio: 1.4, roofForm: "roof-hip", positionX: 0, positionZ: 18, rotationDeg: -25, seed: 500 },
  },
  {
    id: "baroque",
    title: "Baroque — House",
    cam: { buildingZ: 20, cameraY: 2, targetY: 5, fov: 50 },
    props: { architecturalStyle: "baroque", buildingScale: "house", stories: 2, bays: 3, footprintRatio: 1.5, roofForm: "roof-mansard", positionX: 0, positionZ: 20, rotationDeg: 20, seed: 600 },
  },
  {
    id: "renaissance",
    title: "Renaissance — House",
    cam: { buildingZ: 22, cameraY: 2, targetY: 4.5, fov: 50 },
    props: { architecturalStyle: "renaissance", buildingScale: "house", stories: 2, bays: 5, footprintRatio: 1.8, roofForm: "roof-hip", positionX: 0, positionZ: 22, rotationDeg: 15, seed: 700 },
  },
  {
    id: "brutalist",
    title: "Brutalist — Townhouse",
    cam: { buildingZ: 32, cameraY: 2, targetY: 5, fov: 50 },
    props: { architecturalStyle: "brutalist", buildingScale: "townhouse", stories: 3, bays: 4, footprintRatio: 1.6, roofForm: "roof-flat", positionX: 0, positionZ: 32, rotationDeg: -15, seed: 800 },
  },
  {
    id: "art-nouveau",
    title: "Art Nouveau — Townhouse",
    cam: { buildingZ: 24, cameraY: 2, targetY: 6, fov: 50 },
    props: { architecturalStyle: "art-nouveau", buildingScale: "townhouse", stories: 3, bays: 3, footprintRatio: 1.3, roofForm: "roof-mansard", positionX: 0, positionZ: 24, rotationDeg: 20, seed: 900 },
  },
  {
    id: "art-deco",
    title: "Art Deco — Tower",
    cam: { buildingZ: 50, cameraY: 2, targetY: 12, fov: 50 },
    props: { architecturalStyle: "art-deco", buildingScale: "tower", stories: 6, bays: 4, footprintRatio: 1.2, roofForm: "roof-flat", positionX: 0, positionZ: 50, rotationDeg: 15, seed: 1000 },
  },
];

for (const s of singles) {
  const layers = [
    camera(W, H, s.cam),
    building(s.title, s.props, W, H),
  ];
  const file = genart(s.id, s.title, W, H, layers, algo());
  writeFileSync(join(OUT, `${s.id}.genart`), JSON.stringify(file, null, 2) + "\n");
  console.log(`wrote ${s.id}.genart`);
}

// -------------------------------------------------------------------
// Style comparison — 5 buildings in a row, all filled mode
// -------------------------------------------------------------------

const CW = 1600, CH = 600;
const compBuildings = [
  { style: "classical", x: -28, z: 30, rot: 25, seed: 42, bays: 3, stories: 2, ratio: 1.5, roof: "roof-gable", scale: "house" },
  { style: "gothic",    x: -14, z: 30, rot: 15, seed: 43, bays: 3, stories: 2, ratio: 1.5, roof: "roof-gable", scale: "house" },
  { style: "tudor",     x: 0,   z: 30, rot: 10, seed: 44, bays: 3, stories: 2, ratio: 1.3, roof: "roof-gable", scale: "house" },
  { style: "islamic",   x: 14,  z: 30, rot: -15, seed: 45, bays: 3, stories: 2, ratio: 1.2, roof: "roof-dome", scale: "house" },
  { style: "brutalist",  x: 28,  z: 30, rot: -20, seed: 46, bays: 3, stories: 2, ratio: 1.5, roof: "roof-flat", scale: "house" },
];

const compLayers = [
  camera(CW, CH, { buildingZ: 30, cameraY: 2, targetY: 4, fov: 70 }),
  ...compBuildings.map((b, i) => ({
    id: `building-${b.style}`,
    type: "architecture:building",
    name: b.style,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: { x: 0, y: 0, width: CW, height: CH, rotation: 0, scaleX: 1, scaleY: 1, anchorX: 0, anchorY: 0 },
    properties: {
      architecturalStyle: b.style,
      buildingScale: b.scale,
      stories: b.stories,
      bays: b.bays,
      footprintRatio: b.ratio,
      roofForm: b.roof,
      constructionState: 0.8,
      massingVariation: 0,
      weathering: 0,
      positionX: b.x,
      positionZ: b.z,
      rotationDeg: b.rot,
      renderMode: "filled",
      wireframe: false,
      seed: b.seed,
    },
  })),
];

const compFile = genart("style-comparison", "Style Comparison — 5 Styles", CW, CH, compLayers, algo());
writeFileSync(join(OUT, "style-comparison.genart"), JSON.stringify(compFile, null, 2) + "\n");
console.log("wrote style-comparison.genart");

console.log("\nDone. 11 examples generated.");
