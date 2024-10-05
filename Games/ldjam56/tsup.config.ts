import { defineConfig } from "tsup";
import tsconfig from "./tsconfig.json";

export default defineConfig((options) => ({
  entry: ["src/Game.ts"],
  dts: false,
  outDir: "dist",
  format: ["esm"],
  name: "Game build",
  splitting: false,
  outExtension({ format }) {
    return {
      js: `.${format}.js`,
    };
  },
  clean: true,
  target: tsconfig.compilerOptions.target as "es2015",
  sourcemap: process.env.NODE_ENV !== "production",
  minify: process.env.NODE_ENV === "production",
  // minify: !options.watch == Conditional config ==
  noExternal: ["praccen-web-engine"],
}));
