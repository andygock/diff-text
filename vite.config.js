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
  define: {
    global: {},
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    clearMocks: true,
    restoreMocks: true,
  },
});
