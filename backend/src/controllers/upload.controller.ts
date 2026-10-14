import { extname } from "node:path";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ErroExtracao, extrairTextoDoArquivo } from "../services/extracao.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, arquivo, cb) => {
    const ext = extname(arquivo.originalname).toLowerCase();
    if (ext !== ".txt" && ext !== ".pdf") {
      cb(new ErroExtracao("Envie um arquivo .txt ou .pdf."));
      return;
    }
    cb(null, true);
  },
}).single("arquivo");

export function receberArquivo(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (erro: unknown) => {
    if (erro) {
      return res.status(400).json({
        erro: "VALIDACAO",
        mensagem: erro instanceof multer.MulterError && erro.code === "LIMIT_FILE_SIZE"
          ? "O arquivo deve ter no máximo 5 MB."
          : erro instanceof ErroExtracao ? erro.message : "Arquivo inválido.",
      });
    }
    next();
  });
}

export async function extrairTexto(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ erro: "VALIDACAO", mensagem: "Selecione um arquivo .txt ou .pdf." });
  }
  try {
    const conteudo = await extrairTextoDoArquivo(req.file.originalname, req.file.buffer);
    return res.status(200).json({ conteudo });
  } catch (erro) {
    if (erro instanceof ErroExtracao) {
      return res.status(422).json({ erro: "EXTRACAO", mensagem: erro.message });
    }
    console.error("Falha ao extrair arquivo:", erro instanceof Error ? erro.name : "erro desconhecido");
    return res.status(500).json({ erro: "ERRO_INTERNO", mensagem: "Não foi possível processar o arquivo." });
  }
}
