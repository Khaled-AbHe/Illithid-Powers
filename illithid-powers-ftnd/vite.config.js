import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Port the integration tests start the real API on (see src/test/globalSetup.js).
const TEST_API_PORT = 3101;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globalSetup: ["./src/test/globalSetup.js"],
    css: false,
    env: { VITE_API_URL: `http://localhost:${TEST_API_PORT}` },
    testTimeout: 20000,
    fileParallelism: false,
  },
});
