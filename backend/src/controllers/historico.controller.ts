import type { Request, Response } from "express";
import { listarHistoricoDoAutor, listarHistoricoDoDocumento } from "../services/historico.service.js";
import { DocumentoNaoEncontradoError, DocumentoSemPermissaoError } from "../services/documentos.service.js";

export async function historicoDoAutor(_req: Request, res: Response) {
  try {
    return res.status(200).json(await listarHistoricoDoAutor(res.locals.usuarioId as number));
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: "ERRO_INTERNO", mensagem: "Erro interno no servidor." });
  }
}

export async function historicoDoDocumento(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ erro: "VALIDACAO", mensagem: "ID do documento inválido." });
  }
  try {
    return res.status(200).json(await listarHistoricoDoDocumento(Number(id), res.locals.usuarioId as number));
  } catch (erro) {
    if (erro instanceof DocumentoNaoEncontradoError) {
      return res.status(404).json({ erro: "NAO_ENCONTRADO", mensagem: erro.message });
    }
    if (erro instanceof DocumentoSemPermissaoError) {
      return res.status(403).json({ erro: "SEM_PERMISSAO", mensagem: erro.message });
    }
    console.error(erro);
    return res.status(500).json({ erro: "ERRO_INTERNO", mensagem: "Erro interno no servidor." });
  }
}
