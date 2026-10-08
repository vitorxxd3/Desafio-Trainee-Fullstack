
import type { Request, Response } from "express";

import { analisarDocumento } from "../services/analise.service.js";

import {
  DocumentoNaoEncontradoError,
  DocumentoSemPermissaoError,
} from "../services/documentos.service.js";

export async function gerarAnalise(
  req: Request,
  res: Response
) {
  const idParametro = req.params.id;

  if (
    typeof idParametro !== "string" ||
    !/^[1-9]\d*$/.test(idParametro) ||
    !Number.isSafeInteger(Number(idParametro))
  ) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem: "ID do documento inválido.",
    });
  }

  try {
    const usuarioId = res.locals.usuarioId as number;

    const analise = await analisarDocumento(
      Number(idParametro),
      usuarioId
    );

    return res.status(201).json(analise);

  } catch (error) {
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
}
