
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { cadastroSchema, loginSchema } from "../schemas/auth.schema.js";
import {
    
  cadastrarUsuario,
  EmailJaCadastradoError,
  loginUsuario,
  CredenciaisInvalidasError
} from "../services/auth.service.js";

export async function cadastro(
  req: Request,
  res: Response
) {
  const validacao = cadastroSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem:
        validacao.error.issues[0]?.message ??
        "Dados inválidos.",
    });
  }

  try {
    const usuario = await cadastrarUsuario(validacao.data);

    return res.status(201).json(usuario);
  } catch (error) {
    if (
      error instanceof EmailJaCadastradoError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002")
    ) {
      return res.status(409).json({
        erro: "CONFLITO",
        mensagem: "Este e-mail já está cadastrado.",
      });
    }

    console.error(error);

    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor.",
    });
  }
}


export async function login(
  req: Request,
  res: Response
) {
  const validacao = loginSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      erro: "VALIDACAO",
      mensagem:
        validacao.error.issues[0]?.message ??
        "Dados inválidos.",
    });
  }

  try {
    const resultado = await loginUsuario(
      validacao.data
    );

    return res.status(200).json(resultado);

  } catch (error) {
    if (error instanceof CredenciaisInvalidasError) {
      return res.status(401).json({
        erro: "NAO_AUTENTICADO",
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    console.error(error);

    return res.status(500).json({
      erro: "ERRO_INTERNO",
      mensagem: "Erro interno no servidor.",
    });
  }
}
