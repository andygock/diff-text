import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      path: "path-browserify",
    },
  },
  // Note: removed broad `define.global` substitution because it can pull in
  // unexpected polyfills/shims and expand the attack surface. Add targeted
  // polyfills only when a specific global is required.
  // Ensure worker output uses ES modules so Rollup can perform code-splitting
  // without attempting to emit an IIFE/UMD worker bundle.
  worker: {
    format: "es",
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    clearMocks: true,
    restoreMocks: true,
  },
});
