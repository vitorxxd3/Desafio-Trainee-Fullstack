import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { DocumentoInput } from "../schemas/documento.schema.js";

type Ordem = "asc" | "desc";

export async function buscarDocumentos(
  usuarioId: number,
  ordem: Ordem,
  meus: boolean,
  busca?: string,
  pagina?: number,
  limite?: number
) {
  const where: Prisma.DocumentoWhereInput = {
    ...(meus ? { autor_id: usuarioId } : {}),
    ...(busca ? { titulo: { contains: busca, mode: "insensitive" } } : {}),
  };

  // Sem parâmetros de paginação, a resposta continua sendo o array original.
  const paginar = pagina !== undefined || limite !== undefined;
  const paginaAtual = pagina ?? 1;
  const limiteAtual = limite ?? 10;

  const documentos = await prisma.documento.findMany({
    where,
    orderBy: [{ criado_em: ordem }, { id: ordem }],
    ...(paginar
      ? { skip: (paginaAtual - 1) * limiteAtual, take: limiteAtual }
      : {}),
    select: {
      id: true,
      titulo: true,
      criado_em: true,
      autor: { select: { id: true, nome: true } },
      analise: { select: { tipo: true } },
    },
  });

  const dados = documentos.map((documento) => ({
    id: documento.id,
    titulo: documento.titulo,
    autor: documento.autor,
    criado_em: documento.criado_em.toISOString(),
    tipo: documento.analise?.tipo ?? null,
  }));

  if (!paginar) {
    return dados;
  }

  const total = await prisma.documento.count({ where });
  return {
    dados,
    paginacao: {
      pagina: paginaAtual,
      limite: limiteAtual,
      total,
      total_paginas: Math.ceil(total / limiteAtual),
    },
  };
}

export async function criarDocumento(
  dados: DocumentoInput,
  usuarioId: number
) {
  const documento = await prisma.documento.create({
    data: {
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      autor_id: usuarioId,
    },
    include: {
      autor: { select: { id: true, nome: true } },
    },
  });

  return {
    id: documento.id,
    titulo: documento.titulo,
    conteudo: documento.conteudo,
    autor: documento.autor,
    criado_em: documento.criado_em.toISOString(),
    atualizado_em: documento.atualizado_em.toISOString(),
    analise: null,
  };
}

export async function buscarDocumentoPorId(id: number) {
  const documento = await prisma.documento.findUnique({
    where: { id },
    include: {
      autor: { select: { id: true, nome: true } },
      analise: true,
    },
  });

  if (!documento) return null;

  return {
    id: documento.id,
    titulo: documento.titulo,
    conteudo: documento.conteudo,
    autor: documento.autor,
    criado_em: documento.criado_em.toISOString(),
    atualizado_em: documento.atualizado_em.toISOString(),
    analise: documento.analise
      ? {
          tipo: documento.analise.tipo,
          resumo: documento.analise.resumo,
          pontos_de_atencao: documento.analise.pontos_de_atencao,
          analisador: documento.analise.analisador,
          criado_em: documento.analise.criado_em.toISOString(),
        }
      : null,
  };
}

export class DocumentoNaoEncontradoError extends Error {
  constructor() {
    super("Documento não encontrado.");
  }
}

export class DocumentoSemPermissaoError extends Error {
  constructor() {
    super("Você não tem permissão para modificar este documento.");
  }
}

export async function atualizarDocumento(
  id: number,
  usuarioId: number,
  dados: DocumentoInput
) {
  await prisma.$transaction(async (tx) => {
    const documentoAtual = await tx.documento.findUnique({
      where: { id },
      select: { autor_id: true, conteudo: true },
    });

    if (!documentoAtual) throw new DocumentoNaoEncontradoError();
    if (documentoAtual.autor_id !== usuarioId) {
      throw new DocumentoSemPermissaoError();
    }

    const conteudoAlterado = documentoAtual.conteudo !== dados.conteudo;
    await tx.documento.update({
      where: { id },
      data: { titulo: dados.titulo, conteudo: dados.conteudo },
    });

    if (conteudoAlterado) {
      await tx.analise.deleteMany({ where: { documento_id: id } });
    }
  });

  const atualizado = await buscarDocumentoPorId(id);
  if (!atualizado) throw new DocumentoNaoEncontradoError();
  return atualizado;
}

export async function removerDocumento(id: number, usuarioId: number) {
  await prisma.$transaction(async (tx) => {
    const documento = await tx.documento.findUnique({
      where: { id },
      select: { autor_id: true },
    });

    if (!documento) throw new DocumentoNaoEncontradoError();
    if (documento.autor_id !== usuarioId) {
      throw new DocumentoSemPermissaoError();
    }

    await tx.documento.delete({ where: { id } });
  });
}
