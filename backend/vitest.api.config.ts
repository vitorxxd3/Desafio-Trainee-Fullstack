
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({
  path: ".env.test",
  override: true,
});

const url = process.env.DATABASE_URL;

if (!url || new URL(url).pathname !== "/analisador_documentos_teste") {
  throw new Error(
    "Os testes da API só podem executar no banco analisador_documentos_teste."
  );
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/api/**/*.test.ts"],
    fileParallelism: false,
  },
});
