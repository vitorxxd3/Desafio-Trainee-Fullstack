import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Busca por título e paginação", () => {
  const marcador = randomUUID();
  const prefixo = `Busca ${marcador}`;
  const contas: { id: number; email: string; token: string }[] = [];
  const criados: number[] = [];

  async function criarConta(nome: string) {
    const email = `paginacao-${randomUUID()}@exemplo.com`;
    const senha = "Teste12345";
    const cadastro = await request(app).post("/auth/cadastro").send({ nome, email, senha });
    expect(cadastro.status).toBe(201);
    const login = await request(app).post("/auth/login").send({ email, senha });
    expect(login.status).toBe(200);
    const conta = { id: login.body.usuario.id as number, email, token: login.body.token as string };
    contas.push(conta);
    return conta;
  }

  let autor: Awaited<ReturnType<typeof criarConta>>;
  let outro: Awaited<ReturnType<typeof criarConta>>;

  async function criarDocumento(token: string, titulo: string) {
    const resposta = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo, conteudo: "Documento fictício para testes de paginação." });
    expect(resposta.status).toBe(201);
    criados.push(resposta.body.id as number);
    return resposta.body.id as number;
  }

  beforeAll(async () => {
    autor = await criarConta("Autor da Paginação");
    outro = await criarConta("Outro Autor da Paginação");
    await criarDocumento(autor.token, `${prefixo} Contrato A`);
    await criarDocumento(autor.token, `${prefixo} Contrato B`);
    await criarDocumento(autor.token, `${prefixo} Petição C`);
    await criarDocumento(outro.token, `${prefixo} Documento externo`);
  });

  afterAll(async () => {
    await prisma.documento.deleteMany({ where: { id: { in: criados } } });
    await prisma.usuario.deleteMany({ where: { email: { in: contas.map((c) => c.email) } } });
    await prisma.$disconnect();
  });

  it("preserva o array original quando não solicita paginação", async () => {
    const resposta = await request(app)
      .get("/documentos")
      .query({ ordem: "desc", meus: "true" })
      .set("Authorization", `Bearer ${autor.token}`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body.every((d: { autor: { id: number } }) => d.autor.id === autor.id)).toBe(true);
  });

  it("busca apenas pelo título sem diferenciar maiúsculas/minúsculas", async () => {
    const resposta = await request(app)
      .get("/documentos")
      .query({ meus: "true", busca: prefixo.toUpperCase() })
      .set("Authorization", `Bearer ${autor.token}`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body).toHaveLength(3);
  });

  it("pagina, informa totais e respeita o filtro meus", async () => {
    const primeira = await request(app)
      .get("/documentos")
      .query({ busca: prefixo, meus: "true", pagina: "1", limite: "2", ordem: "desc" })
      .set("Authorization", `Bearer ${autor.token}`);

    const segunda = await request(app)
      .get("/documentos")
      .query({ busca: prefixo, meus: "true", pagina: "2", limite: "2", ordem: "desc" })
      .set("Authorization", `Bearer ${autor.token}`);

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);
    expect(primeira.body.dados).toHaveLength(2);
    expect(segunda.body.dados).toHaveLength(1);
    expect(primeira.body.paginacao).toEqual({
      pagina: 1, limite: 2, total: 3, total_paginas: 2,
    });

    const ids = [...primeira.body.dados, ...segunda.body.dados].map((d: { id: number }) => d.id);
    expect(new Set(ids).size).toBe(3);
    expect(primeira.body.dados[0].id).toBeGreaterThan(primeira.body.dados[1].id);
    expect(segunda.body.dados[0].id).toBeLessThan(primeira.body.dados[1].id);
  });

  it("rejeita parâmetros inválidos com erro 400 padronizado", async () => {
    for (const parametro of ["pagina=0", "pagina=-1", "limite=0", "limite=101", "pagina=abc", "busca=x&busca=y"]) {
      const resposta = await request(app)
        .get(`/documentos?${parametro}`)
        .set("Authorization", `Bearer ${autor.token}`);
      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toBe("VALIDACAO");
    }
  });
});
