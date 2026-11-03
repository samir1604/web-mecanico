import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // El sandbox de aprendizaje usa `node:test`; no lo corre Vitest.
    include: ["src/**/*.test.ts"],
  },
});
