
import express from "express";
import cors from "cors";
import type { ErrorRequestHandler } from "express";

import { authRoutes } from "./routes/auth.routes.js";
import { documentosRoutes } from "./routes/documentos.routes.js";

export const app = express();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    mensagem: "API rodando com sucesso",
  });
});

app.use("/auth", authRoutes);
app.use("/documentos", documentosRoutes);

// Padronização dos erros de leitura do JSON.
const tratarErros: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  const status = error?.status ?? error?.statusCode;

  if (status === 400 || status === 413 || status === 415) {
    res.status(400).json({
      erro: "VALIDACAO",
      mensagem:
        status === 413
          ? "O corpo da requisição excede o limite permitido."
          : "O corpo JSON da requisição é inválido.",
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    erro: "ERRO_INTERNO",
    mensagem: "Erro interno no servidor.",
  });
};

app.use(tratarErros);
