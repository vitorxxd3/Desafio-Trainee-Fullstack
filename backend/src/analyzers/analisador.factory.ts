import type { Analisador } from "./analisador.interface.js";
import { AnalisadorRegras } from "./analisador-regras.js";
import { AnalisadorGemini } from "./analisador-gemini.js";

export function criarAnalisador(): Analisador {
  const tipo = process.env.ANALISADOR ?? "regras";

  switch (tipo) {
    case "regras":
      return new AnalisadorRegras();
    case "gemini":
      return new AnalisadorGemini();
    default:
      throw new Error(`Analisador não suportado: ${tipo}`);
  }
}
