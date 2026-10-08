
import { prisma } from "../lib/prisma.js";
import { criarAnalisador } from "../analyzers/analisador.factory.js";

import {
  DocumentoNaoEncontradoError,
  DocumentoSemPermissaoError,
} from "./documentos.service.js";

export async function analisarDocumento(
  id: number,
  usuarioId: number
) {
  const documento = await prisma.documento.findUnique({
    where: { id },
    select: {
      id: true,
      conteudo: true,
      autor_id: true,
    },
  });

  if (!documento) {
    throw new DocumentoNaoEncontradoError();
  }

  if (documento.autor_id !== usuarioId) {
    throw new DocumentoSemPermissaoError();
  }

  const analisador = criarAnalisador();

  const resultado = await analisador.analisar(
    documento.conteudo
  );

  const analise = await prisma.analise.upsert({
    where: {
      documento_id: documento.id,
    },

    create: {
      documento_id: documento.id,
      tipo: resultado.tipo,
      resumo: resultado.resumo,
      pontos_de_atencao: resultado.pontos_de_atencao,
      analisador: "regras",
    },

    update: {
      tipo: resultado.tipo,
      resumo: resultado.resumo,
      pontos_de_atencao: resultado.pontos_de_atencao,
      analisador: "regras",
      criado_em: new Date(),
    },
  });

  return {
    tipo: analise.tipo,
    resumo: analise.resumo,
    pontos_de_atencao: analise.pontos_de_atencao,
    analisador: analise.analisador,
    criado_em: analise.criado_em.toISOString(),
  };
}
