import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

describe("Histórico de análises e importação de arquivos", () => {
  const email = `extras-${randomUUID()}@exemplo.com`;
  let token = "";
  let usuarioId = 0;
  const ids: number[] = [];

  beforeAll(async () => {
    const cadastro = await request(app).post("/auth/cadastro")
      .send({ nome: "Autor Extras", email, senha: "Teste12345" });
    expect(cadastro.status).toBe(201);
    usuarioId = cadastro.body.id;
    const login = await request(app).post("/auth/login")
      .send({ email, senha: "Teste12345" });
    expect(login.status).toBe(200);
    token = login.body.token;
  });

  afterAll(async () => {
    await prisma.documento.deleteMany({ where: { id: { in: ids } } });
    await prisma.usuario.deleteMany({ where: { id: usuarioId } });
    await prisma.$disconnect();
  });

  async function documento() {
    const response = await request(app).post("/documentos")
      .set("Authorization", `Bearer ${token}`)
      .send({ titulo: "Contrato fictício", conteudo: "Contrato com multa por rescisão em 10 dias." });
    expect(response.status).toBe(201);
    ids.push(response.body.id);
    return response.body.id as number;
  }

  it("aceita .txt UTF-8 e não grava documento automaticamente", async () => {
    const semToken = await request(app).post("/documentos/extrair-texto")
      .attach("arquivo", Buffer.from("Contrato"), "contrato.txt");
    expect(semToken.status).toBe(401);

    const resposta = await request(app).post("/documentos/extrair-texto")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", Buffer.from("Texto jurídico fictício.\nMulta contratual.", "utf8"), "contrato.txt");
    expect(resposta.status).toBe(200);
    expect(resposta.body.conteudo).toBe("Texto jurídico fictício.\nMulta contratual.");
  });

  it("extrai texto de um PDF com texto selecionável", async () => {
    const arquivo = new URL("../fixtures/documento-ficticio.pdf", import.meta.url);
    const resposta = await request(app).post("/documentos/extrair-texto")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", readFileSync(arquivo), "documento-ficticio.pdf");
    expect(resposta.status).toBe(200);
    expect(resposta.body.conteudo).toContain("Prazo contratual de dez dias.");
  });

  it("rejeita extensões indevidas, PDF inválido e arquivo gigante", async () => {
    const proibido = await request(app).post("/documentos/extrair-texto")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", Buffer.from("texto"), "texto.exe");
    expect(proibido.status).toBe(400);

    const pdfInvalido = await request(app).post("/documentos/extrair-texto")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", Buffer.from("não é PDF"), "arquivo.pdf");
    expect(pdfInvalido.status).toBe(422);

    const grande = await request(app).post("/documentos/extrair-texto")
      .set("Authorization", `Bearer ${token}`)
      .attach("arquivo", Buffer.alloc(5 * 1024 * 1024 + 1, 65), "grande.txt");
    expect(grande.status).toBe(400);
  });

  it("arquiva análises refeitas, editadas e de documentos excluídos", async () => {
    const id = await documento();
    const h = { Authorization: `Bearer ${token}` };

    expect((await request(app).post(`/documentos/${id}/analise`).set(h)).status).toBe(201);
    expect((await request(app).post(`/documentos/${id}/analise`).set(h)).status).toBe(201);
    const antes = await request(app).get(`/documentos/${id}/historico`).set(h);
    expect(antes.status).toBe(200);
    expect(antes.body).toHaveLength(1);
    expect(antes.body[0].motivo).toBe("SUBSTITUIDA");

    const atualizado = await request(app).put(`/documentos/${id}`).set(h)
      .send({ titulo: "Contrato fictício", conteudo: "Novo conteúdo: contrato alterado." });
    expect(atualizado.status).toBe(200);
    expect(atualizado.body.analise).toBeNull();

    const depois = await request(app).get(`/documentos/${id}/historico`).set(h);
    expect(depois.body.map((a: { motivo: string }) => a.motivo)).toContain("CONTEUDO_ALTERADO");

    expect((await request(app).post(`/documentos/${id}/analise`).set(h)).status).toBe(201);
    expect((await request(app).delete(`/documentos/${id}`).set(h)).status).toBe(204);

    const geral = await request(app).get("/historico-analises").set(h);
    expect(geral.status).toBe(200);
    const eventos = geral.body.filter((a: { documento_id_origem: number }) => a.documento_id_origem === id);
    expect(eventos).toHaveLength(3);
    expect(eventos.map((a: { motivo: string }) => a.motivo)).toContain("DOCUMENTO_EXCLUIDO");
  });
});
