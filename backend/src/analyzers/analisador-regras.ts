
import type {
  Analisador,
  ResultadoAnalise,
  TipoDocumento,
} from "./analisador.interface.js";

import {
  termosPorTipo,
  termosAtencao,
  prioridadeTipos,
} from "./glossario.js";

function normalizarComparacao(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function contemTermo(
  fraseNormalizada: string,
  termo: string
): boolean {
  const termoNormalizado = normalizarComparacao(termo);

  const termoEscapado = termoNormalizado.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const expressao = new RegExp(
    `(^|[^a-z0-9])${termoEscapado}(?=$|[^a-z0-9])`
  );

  return expressao.test(fraseNormalizada);
}

function dividirFrases(conteudo: string): string[] {
  const texto = conteudo
    .normalize("NFC")
    .replace(/\r\n?/g, "\n");

  return texto
    .split("\n")
    .flatMap((linha) =>
      linha.split(/(?<=[.!?])[^\S\n]+/u)
    )
    .map((frase) =>
      frase.trim().replace(/[^\S\n]+/g, " ")
    )
    .filter((frase) => frase.length > 0);
}

export class AnalisadorRegras implements Analisador {
  analisar(conteudo: string): ResultadoAnalise {
    const frases = dividirFrases(conteudo);

    const frasesNormalizadas = frases.map(
      normalizarComparacao
    );

    // Identificar o tipo do documento
    let tipo: TipoDocumento = "outro";
    let maiorContagem = 0;

    for (const candidato of prioridadeTipos) {
      const contagem = termosPorTipo[candidato].filter(
        (termo) =>
          frasesNormalizadas.some((frase) =>
            contemTermo(frase, termo)
          )
      ).length;

      if (contagem > maiorContagem) {
        maiorContagem = contagem;
        tipo = candidato;
      }
    }

    // Resumir com as duas primeiras frases
    let resumo = frases.slice(0, 2).join(" ");

    const caracteres = Array.from(resumo);

    if (caracteres.length > 300) {
      resumo =
        caracteres.slice(0, 297).join("").trimEnd() +
        "...";
    }

    // Identificar pontos de atenção
    const frasesDeAtencao = frases.filter(
      (_frase, indice) =>
        termosAtencao.some((termo) =>
          contemTermo(
            frasesNormalizadas[indice],
            termo
          )
        )
    );

    const pontos_de_atencao = [
      ...new Set(frasesDeAtencao),
    ];

    return {
      tipo,
      resumo,
      pontos_de_atencao,
    };
  }
}
