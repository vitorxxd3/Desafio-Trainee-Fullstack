import { prisma } from "../lib/prisma.js";
import { criarAnalisador } from "../analyzers/analisador.factory.js";
import { arquivarAnalise } from "./historico.service.js";
import { DocumentoNaoEncontradoError, DocumentoSemPermissaoError } from "./documentos.service.js";

export class DocumentoAlteradoDuranteAnaliseError extends Error {
  constructor() {
    super("O documento foi alterado durante a análise. Tente novamente.");
  }
}

export async function analisarDocumento(id: number, usuarioId: number) {
  const documento = await prisma.documento.findUnique({
    where: { id },
    select: { id: true, titulo: true, conteudo: true, autor_id: true },
  });

  if (!documento) throw new DocumentoNaoEncontradoError();
  if (documento.autor_id !== usuarioId) throw new DocumentoSemPermissaoError();

  const nomeAnalisador = process.env.ANALISADOR ?? "regras";
  const resultado = await criarAnalisador().analisar(documento.conteudo);

  // A criação do histórico e a substituição ocorrem atomicamente.
  const analise = await prisma.$transaction(async (tx) => {
    const atual = await tx.documento.findUnique({
      where: { id },
      select: { id: true, titulo: true, conteudo: true, autor_id: true },
    });
    if (!atual) throw new DocumentoNaoEncontradoError();
    if (atual.autor_id !== usuarioId) throw new DocumentoSemPermissaoError();
    if (atual.conteudo !== documento.conteudo) {
      throw new DocumentoAlteradoDuranteAnaliseError();
    }

    await arquivarAnalise(tx, atual, "SUBSTITUIDA");
    return tx.analise.upsert({
      where: { documento_id: id },
      create: {
        documento_id: id,
        tipo: resultado.tipo,
        resumo: resultado.resumo,
        pontos_de_atencao: resultado.pontos_de_atencao,
        analisador: nomeAnalisador,
      },
      update: {
        tipo: resultado.tipo,
        resumo: resultado.resumo,
        pontos_de_atencao: resultado.pontos_de_atencao,
        analisador: nomeAnalisador,
        criado_em: new Date(),
      },
    });
  });

  return {
    tipo: analise.tipo,
    resumo: analise.resumo,
    pontos_de_atencao: analise.pontos_de_atencao,
    analisador: analise.analisador,
    criado_em: analise.criado_em.toISOString(),
  };
}
