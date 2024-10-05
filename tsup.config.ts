import { defineConfig } from "tsup";
import tsconfig from "./tsconfig.json";

export default defineConfig((options) => ({
  entry: [
    "src/Engine.ts"
  ],
  dts: true,
  outDir: "dist",
  format: ["esm"],
  name: "Engine build",
  splitting: false,
  treeshake: true,
  outExtension({ format }) {
    return {
      js: `.${format}.js`,
    };
  },
  sourcemap: true,
  clean: true,
  target: tsconfig.compilerOptions.target as "es2016",
  minify: false,
  // minify: !options.watch == Conditional config ==
  noExternal: ["gl-matrix"],
}));