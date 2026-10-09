
import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Autenticação da API", () => {
  const email = `teste-api-${randomUUID()}@exemplo.com`;
  const senha = "Teste12345";
  let token = "";

  beforeAll(async () => {
    const resposta = await request(app)
      .post("/auth/cadastro")
      .send({
        nome: "Usuário de Teste",
        email,
        senha,
      });

    expect(resposta.status).toBe(201);
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email },
    });

    await prisma.$disconnect();
  });

  it("não permite cadastrar e-mail duplicado", async () => {
    const resposta = await request(app)
      .post("/auth/cadastro")
      .send({
        nome: "Outro Usuário",
        email,
        senha,
      });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toBe("CONFLITO");
  });

  it("realiza login com credenciais válidas", async () => {
    const resposta = await request(app)
      .post("/auth/login")
      .send({ email, senha });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toBeTruthy();
    expect(resposta.body.usuario.email).toBe(email);

    token = resposta.body.token;
  });

  it("rejeita senha incorreta", async () => {
    const resposta = await request(app)
      .post("/auth/login")
      .send({
        email,
        senha: "SenhaIncorreta123",
      });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe("NAO_AUTENTICADO");
  });

  it("bloqueia documentos sem autenticação", async () => {
    const resposta = await request(app)
      .get("/documentos");

    expect(resposta.status).toBe(401);
  });

  it("permite listar documentos com token válido", async () => {
    const resposta = await request(app)
      .get("/documentos")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
  });
});
