
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import type { CadastroInput } from "../schemas/auth.schema.js";

import jwt from "jsonwebtoken";
import type { LoginInput } from "../schemas/auth.schema.js";


export class EmailJaCadastradoError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado.");
  }
}

export async function cadastrarUsuario(
  dados: CadastroInput
) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      email: dados.email,
    },
  });

  if (usuarioExistente) {
    throw new EmailJaCadastradoError();
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      senha_hash: senhaHash,
    },
    select: {
      id: true,
      nome: true,
      email: true,
    },
  });

  return usuario;
}


export class CredenciaisInvalidasError extends Error {
  constructor() {
    super("E-mail ou senha inválidos.");
  }
}

export async function loginUsuario(dados: LoginInput) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      email: dados.email,
    },
  });

  if (!usuario) {
    throw new CredenciaisInvalidasError();
  }

  const senhaCorreta = await bcrypt.compare(
    dados.senha,
    usuario.senha_hash
  );

  if (!senhaCorreta) {
    throw new CredenciaisInvalidasError();
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET não configurado.");
  }

  const token = jwt.sign(
    { sub: String(usuario.id) },
    jwtSecret,
    { expiresIn: "1d" }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    },
  };
}

