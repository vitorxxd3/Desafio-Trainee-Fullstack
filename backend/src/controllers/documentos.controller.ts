
import type { Request, Response } from "express";

import { criarDocumento } from "../services/documentos.service.js";
import { documentoSchema } from "../schemas/documento.schema.js";
import {
  atualizarDocumento,
  removerDocumento,
  DocumentoNaoEncontradoError,
  DocumentoSemPermissaoError,
   buscarDocumentos, buscarDocumentoPorId
} from "../services/documentos.service.js";


export async function listarDocumentos(
  req: Request,
  res: Response
) {
  const { ordem, meus } = req.query;

  if (
    (ordem !== undefined && ordem !== "asc" && ordem !== "desc") ||
    (meus !== undefined && meus !== "true" && meus !== "false")
  ) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "Parâmetros de consulta inválidos."
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;

    const documentos = await buscarDocumentos(
      usuarioId,
      ordem === "asc" ? "asc" : "desc",
      meus === "true"
    );

    return res.status(200).json(documentos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor."
    });
  }
}


export async function cadastrarDocumento(
  req: Request,
  res: Response
) {
  const validacao = documentoSchema.safeParse(
    req.body
  );

  if (!validacao.success) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem:
        validacao.error.issues[0]?.message ??
        "Dados inválidos.",
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;

    const documento = await criarDocumento(
      validacao.data,
      usuarioId
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


export async function detalharDocumento(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  try {
    const documento = await buscarDocumentoPorId(
      Number(id)
    );

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


function validarId(id: unknown): number | null {
  if (
    typeof id !== "string" ||
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(Number(id))
  ) {
    return null;
  }

  return Number(id);
}


function tratarErroDocumento(
  error: unknown,
  res: Response
) {
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

// PUT /documentos/:id
export async function editarDocumento(
  req: Request,
  res: Response
) {
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
      mensagem:
        validacao.error.issues[0]?.message ??
        "Dados inválidos.",
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;

    const documento = await atualizarDocumento(
      id,
      usuarioId,
      validacao.data
    );

    return res.status(200).json(documento);
  } catch (error) {
    return tratarErroDocumento(error, res);
  }
}

// DELETE /documentos/:id
export async function excluirDocumento(
  req: Request,
  res: Response
) {
  const id = validarId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;

    await removerDocumento(id, usuarioId);

    return res.status(204).send();
  } catch (error) {
    return tratarErroDocumento(error, res);
  }
}
