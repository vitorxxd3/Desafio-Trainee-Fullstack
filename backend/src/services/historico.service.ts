import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  DocumentoNaoEncontradoError,
  DocumentoSemPermissaoError,
} from "./documentos.service.js";

export type MotivoArquivamento =
  | "SUBSTITUIDA"
  | "CONTEUDO_ALTERADO"
  | "DOCUMENTO_EXCLUIDO";

interface DocumentoParaHistorico {
  id: number;
  titulo: string;
  autor_id: number;
}

// Deve ser chamado DENTRO da mesma transação que modifica ou apaga a análise.
export async function arquivarAnalise(
  tx: Prisma.TransactionClient,
  documento: DocumentoParaHistorico,
  motivo: MotivoArquivamento
) {
  const atual = await tx.analise.findUnique({
    where: { documento_id: documento.id },
  });
  if (!atual) return;

  await tx.historicoAnalise.create({
    data: {
      documento_id_origem: documento.id,
      titulo_documento: documento.titulo,
      autor_id: documento.autor_id,
      motivo,
      tipo: atual.tipo,
      resumo: atual.resumo,
      pontos_de_atencao: atual.pontos_de_atencao as Prisma.InputJsonValue,
      analisador: atual.analisador,
      analisada_em: atual.criado_em,
    },
  });
}

export async function listarHistoricoDoAutor(usuarioId: number) {
  return prisma.historicoAnalise.findMany({
    where: { autor_id: usuarioId },
    orderBy: [{ arquivada_em: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      documento_id_origem: true,
      titulo_documento: true,
      motivo: true,
      tipo: true,
      resumo: true,
      pontos_de_atencao: true,
      analisador: true,
      analisada_em: true,
      arquivada_em: true,
    },
  });
}

export async function listarHistoricoDoDocumento(
  documentoId: number,
  usuarioId: number
) {
  const documento = await prisma.documento.findUnique({
    where: { id: documentoId },
    select: { autor_id: true },
  });
  if (!documento) throw new DocumentoNaoEncontradoError();
  if (documento.autor_id !== usuarioId) throw new DocumentoSemPermissaoError();
  return prisma.historicoAnalise.findMany({
    where: { documento_id_origem: documentoId, autor_id: usuarioId },
    orderBy: [{ arquivada_em: "desc" }, { id: "desc" }],
    take: 100,
  });
}
