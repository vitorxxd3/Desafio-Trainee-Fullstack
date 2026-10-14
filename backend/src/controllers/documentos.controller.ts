import type { Request, Response } from "express";
import { documentoSchema } from "../schemas/documento.schema.js";
import {
  atualizarDocumento,
  buscarDocumentos,
  buscarDocumentoPorId,
  criarDocumento,
  DocumentoNaoEncontradoError,
  DocumentoSemPermissaoError,
  removerDocumento,
} from "../services/documentos.service.js";

function numeroInteiroPositivo(valor: unknown): number | null {
  if (
    typeof valor !== "string" ||
    !/^[1-9]\d*$/.test(valor) ||
    !Number.isSafeInteger(Number(valor))
  ) {
    return null;
  }
  return Number(valor);
}

export async function listarDocumentos(req: Request, res: Response) {
  const { ordem, meus, busca, pagina, limite } = req.query;

  const paginaNumero = pagina === undefined ? undefined : numeroInteiroPositivo(pagina);
  const limiteNumero = limite === undefined ? undefined : numeroInteiroPositivo(limite);
  const paginaEfetiva = paginaNumero ?? 1;
  const limiteEfetivo = limiteNumero ?? 10;

  if (
    (ordem !== undefined && ordem !== "asc" && ordem !== "desc") ||
    (meus !== undefined && meus !== "true" && meus !== "false") ||
    (busca !== undefined && (typeof busca !== "string" || Array.from(busca).length > 200)) ||
    (pagina !== undefined && paginaNumero === null) ||
    (limite !== undefined && (limiteNumero === null || limiteNumero === undefined || limiteNumero > 100)) ||
    (pagina !== undefined || limite !== undefined) &&
      (paginaEfetiva - 1) * limiteEfetivo > 2_147_483_647
  ) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "Parâmetros de consulta inválidos.",
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;
    const documentos = await buscarDocumentos(
      usuarioId,
      ordem === "asc" ? "asc" : "desc",
      meus === "true",
      typeof busca === "string" ? busca.trim() || undefined : undefined,
      paginaNumero ?? undefined,
      limiteNumero ?? undefined
    );
    return res.status(200).json(documentos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor.",
    });
  }
}

export async function cadastrarDocumento(req: Request, res: Response) {
  const validacao = documentoSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    });
  }

  try {
    const documento = await criarDocumento(
      validacao.data,
      res.locals.usuarioId as number
    );
    return res.status(201).json(documento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor.",
    });
  }
}

function validarId(id: unknown): number | null {
  return numeroInteiroPositivo(id);
}

export async function detalharDocumento(req: Request, res: Response) {
  const id = validarId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  try {
    const documento = await buscarDocumentoPorId(id);
    if (!documento) {
      return res.status(404).json({
        erro: "NAO_ENCONTRADO",
        mensagem: "Documento não encontrado.",
      });
    }
    return res.status(200).json(documento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor.",
    });
  }
}

function tratarErroDocumento(error: unknown, res: Response) {
  if (error instanceof DocumentoNaoEncontradoError) {
    return res.status(404).json({
      erro: "NAO_ENCONTRADO",
      mensagem: error.message,
    });
  }
  if (error instanceof DocumentoSemPermissaoError) {
    return res.status(403).json({
      erro: "SEM_PERMISSAO",
      mensagem: error.message,
    });
  }
  console.error(error);
  return res.status(500).json({
    erro: "ERRO_INTERNO",
    mensagem: "Erro interno no servidor.",
  });
}

export async function editarDocumento(req: Request, res: Response) {
  const id = validarId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  const validacao = documentoSchema.safeParse(req.body);
  if (!validacao.success) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: validacao.error.issues[0]?.message ?? "Dados inválidos.",
    });
  }

  try {
    const documento = await atualizarDocumento(
      id,
      res.locals.usuarioId as number,
      validacao.data
    );
    return res.status(200).json(documento);
  } catch (error) {
    return tratarErroDocumento(error, res);
  }
}

export async function excluirDocumento(req: Request, res: Response) {
  const id = validarId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  try {
    await removerDocumento(id, res.locals.usuarioId as number);
    return res.status(204).send();
  } catch (error) {
    return tratarErroDocumento(error, res);
  }
}
