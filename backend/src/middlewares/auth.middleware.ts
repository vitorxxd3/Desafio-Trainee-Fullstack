
import type {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";

export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      erro: "NAO_AUTENTICADO",
      mensagem: "Token não fornecido."
    });
  }

  const token = authorization.slice(7);

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor."
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string"
    ) {
      throw new Error("Token inválido");
    }

    const usuarioId = Number(payload.sub);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
      throw new Error("Identificador inválido");
    }

    res.locals.usuarioId = usuarioId;

    next();
  } catch {
    return res.status(401).json({
      erro: "NAO_AUTENTICADO",
      mensagem: "Token inválido ou expirado."
    });
  }
}
