import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "@genart-dev/core",
  ],
  // projection + plugin-perspective are intentionally bundled in
  // so the generated compositor renderer works inside the iframe
  // (which stubs require() for external deps).
  noExternal: [
    "@genart-dev/projection",
    "@genart-dev/plugin-perspective",
    "@genart-dev/illustration",
  ],
});
