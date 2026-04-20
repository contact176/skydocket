import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // ── Vitest configuration ───────────────────────────────────────────────────
  // Vitest reuses this file so JSX and aliases stay in sync with the build.
  test: {
    environment: "jsdom",   // simulates browser APIs for React component tests
    globals: true,           // exposes describe/it/expect without imports
    setupFiles: ["./src/test/setup.js"],
    exclude: ["node_modules", "dist"],
  },
});