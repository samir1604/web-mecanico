import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // El sandbox de aprendizaje usa `node:test`; no lo corre Vitest.
    include: ["src/**/*.test.ts"],
  },
});
