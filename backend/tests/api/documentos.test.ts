
import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

interface ContaTeste {
  id: number;
  email: string;
  token: string;
}

describe("Documentos da API", () => {
  let autor: ContaTeste;
  let outroUsuario: ContaTeste;

  async function criarConta(nome: string): Promise<ContaTeste> {
    const email = `teste-${randomUUID()}@exemplo.com`;
    const senha = "Teste12345";

    const cadastro = await request(app)
      .post("/auth/cadastro")
      .send({ nome, email, senha });

    expect(cadastro.status).toBe(201);

    
it("aceita conteúdo com 50.000 caracteres Unicode", async () => {
  const conteudo = "🙂".repeat(50000);

  const resposta = await request(app)
    .post("/documentos")
    .set("Authorization", `Bearer ${autor.token}`)
    .send({
      titulo: "Documento com caracteres Unicode",
      conteudo,
    });

  expect(resposta.status).toBe(201);
  expect(resposta.body.conteudo).toBe(conteudo);
});


    const login = await request(app)
      .post("/auth/login")
      .send({ email, senha });

    expect(login.status).toBe(200);

    return {
      id: login.body.usuario.id,
      email,
      token: login.body.token,
    };
  }

  async function criarDocumento(
    conta: ContaTeste,
    titulo = "Contrato de teste",
    conteudo = "Este contrato prevê multa e prazo de vigência."
  ) {
    const resposta = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${conta.token}`)
      .send({ titulo, conteudo });

    expect(resposta.status).toBe(201);

    return resposta.body.id as number;
  }

  beforeAll(async () => {
    autor = await criarConta("Autor Teste");
    outroUsuario = await criarConta("Outro Usuário");
  });

  afterEach(async () => {
    const ids = [autor?.id, outroUsuario?.id].filter(
      (id): id is number => typeof id === "number"
    );

    if (ids.length > 0) {
      await prisma.documento.deleteMany({
        where: {
          autor_id: { in: ids },
        },
      });
    }
  });

  afterAll(async () => {
    const emails = [autor?.email, outroUsuario?.email].filter(
      (email): email is string => typeof email === "string"
    );

    if (emails.length > 0) {
      await prisma.usuario.deleteMany({
        where: {
          email: { in: emails },
        },
      });
    }

    await prisma.$disconnect();
  });

  it("cria documento e preserva o conteúdo original", async () => {
    const conteudo = "  Primeira linha.\r\n\r\n  Segunda linha.  ";

    const id = await criarDocumento(
      autor,
      "Documento de teste",
      conteudo
    );

    const resposta = await request(app)
      .get(`/documentos/${id}`)
      .set("Authorization", `Bearer ${autor.token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.titulo).toBe("Documento de teste");
    expect(resposta.body.conteudo).toBe(conteudo);
  });

  it("rejeita título ou conteúdo apenas com espaços", async () => {
    const tituloInvalido = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${autor.token}`)
      .send({
        titulo: "   ",
        conteudo: "Conteúdo válido",
      });

    expect(tituloInvalido.status).toBe(400);
    expect(tituloInvalido.body.erro).toBe("VALIDACAO");

    const conteudoInvalido = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${autor.token}`)
      .send({
        titulo: "Título válido",
        conteudo: "   ",
      });

    expect(conteudoInvalido.status).toBe(400);
    expect(conteudoInvalido.body.erro).toBe("VALIDACAO");
  });

  it("impede outro usuário de editar, excluir ou analisar", async () => {
    const id = await criarDocumento(autor);

    const headers = {
      Authorization: `Bearer ${outroUsuario.token}`,
    };

    const edicao = await request(app)
      .put(`/documentos/${id}`)
      .set(headers)
      .send({
        titulo: "Alteração não autorizada",
        conteudo: "Conteúdo alterado",
      });

    const exclusao = await request(app)
      .delete(`/documentos/${id}`)
      .set(headers);

    const analise = await request(app)
      .post(`/documentos/${id}/analise`)
      .set(headers);

    expect(edicao.status).toBe(403);
    expect(exclusao.status).toBe(403);
    expect(analise.status).toBe(403);

    const documento = await request(app)
      .get(`/documentos/${id}`)
      .set("Authorization", `Bearer ${autor.token}`);

    expect(documento.status).toBe(200);
    expect(documento.body.titulo).toBe("Contrato de teste");
  });

  it("mantém a análise ao editar título e remove ao editar conteúdo", async () => {
    const conteudo = "O contrato prevê multa por rescisão.";
    const id = await criarDocumento(
      autor,
      "Título original",
      conteudo
    );

    const headers = {
      Authorization: `Bearer ${autor.token}`,
    };

    const analise = await request(app)
      .post(`/documentos/${id}/analise`)
      .set(headers);

    expect(analise.status).toBe(201);

    const tituloAlterado = await request(app)
      .put(`/documentos/${id}`)
      .set(headers)
      .send({
        titulo: "Novo título",
        conteudo,
      });

    expect(tituloAlterado.status).toBe(200);

    const depoisDoTitulo = await request(app)
      .get(`/documentos/${id}`)
      .set(headers);

    expect(depoisDoTitulo.body.analise).not.toBeNull();

    const conteudoAlterado = await request(app)
      .put(`/documentos/${id}`)
      .set(headers)
      .send({
        titulo: "Novo título",
        conteudo: "Conteúdo completamente diferente.",
      });

    expect(conteudoAlterado.status).toBe(200);

    const depoisDoConteudo = await request(app)
      .get(`/documentos/${id}`)
      .set(headers);

    expect(depoisDoConteudo.body.analise).toBeNull();
  });

  it("filtra documentos do usuário e valida a ordenação", async () => {
    const meuId = await criarDocumento(
      autor,
      "Documento do autor"
    );

    await criarDocumento(
      outroUsuario,
      "Documento de outra pessoa"
    );

    const headers = {
      Authorization: `Bearer ${autor.token}`,
    };

    const meus = await request(app)
      .get("/documentos?meus=true&ordem=desc")
      .set(headers);

    expect(meus.status).toBe(200);
    expect(meus.body.some(
      (documento: { id: number }) => documento.id === meuId
    )).toBe(true);

    expect(meus.body.every(
      (documento: { autor: { id: number } }) =>
        documento.autor.id === autor.id
    )).toBe(true);

    const ordemInvalida = await request(app)
      .get("/documentos?ordem=invalida")
      .set(headers);

    expect(ordemInvalida.status).toBe(400);
  });

  it("exclui documento e retorna 404 ao consultá-lo novamente", async () => {
    const id = await criarDocumento(autor);

    const headers = {
      Authorization: `Bearer ${autor.token}`,
    };

    const exclusao = await request(app)
      .delete(`/documentos/${id}`)
      .set(headers);

    expect(exclusao.status).toBe(204);

    const consulta = await request(app)
      .get(`/documentos/${id}`)
      .set(headers);

    expect(consulta.status).toBe(404);
    expect(consulta.body.erro).toBe("NAO_ENCONTRADO");
  });
});
