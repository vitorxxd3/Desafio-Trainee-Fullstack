import { AnalisadorRegras } from "../src/analyzers/analisador-regras.js";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";




const pastaExemplos = resolve(
  process.cwd(),
  "../exemplos"
);


const arquivos = [
  "01-contrato-locacao",
  "02-peticao-indenizacao",
  "03-sentenca-cobranca",
  "04-notificacao-aluguel",
  "05-procuracao",
  "06-casos-de-borda",
];

describe("Analisador de documentos por regras", () => {
  const analisador = new AnalisadorRegras();

  it.each(arquivos)(
    "deve produzir a saída esperada para %s",
    (arquivo) => {
      const conteudo = readFileSync(
        resolve(pastaExemplos, `${arquivo}.txt`),
        "utf8"
      );

      const esperado = JSON.parse(
        readFileSync(
          resolve(
            pastaExemplos,
            `${arquivo}.esperado.json`
          ),
          "utf8"
        )
      );

      const resultado = analisador.analisar(conteudo);

      expect(resultado).toEqual(esperado);
    }
  );
});
