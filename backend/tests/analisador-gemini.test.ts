import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalisadorGemini } from "../src/analyzers/analisador-gemini.js";

const simularResposta = vi.hoisted(() => vi.fn());

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: simularResposta };
  },
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    ARRAY: "ARRAY",
  },
}));

describe("Analisador com Gemini (API simulada)", () => {
  beforeEach(() => {
    simularResposta.mockReset();
    vi.stubEnv("GEMINI_API_KEY", "chave-ficticia-para-teste");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna a estrutura válida com trechos existentes no documento", async () => {
    simularResposta.mockResolvedValue({
      text: JSON.stringify({
        tipo: "contrato",
        resumo: "Contrato com prazo e multa.",
        pontos_de_atencao: ["multa de 10%"],
      }),
    });
    const resultado = await new AnalisadorGemini().analisar(
      "O contrato prevê multa de 10%."
    );
    expect(resultado.tipo).toBe("contrato");
    expect(resultado.pontos_de_atencao).toEqual(["multa de 10%"]);
  });

  it("rejeita uma classificação fora dos tipos permitidos", async () => {
    simularResposta.mockResolvedValue({
      text: JSON.stringify({
        tipo: "inexistente",
        resumo: "Documento inválido.",
        pontos_de_atencao: [],
      }),
    });
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 502 });
  });

  it("rejeita pontos de atenção inventados", async () => {
    simularResposta.mockResolvedValue({
      text: JSON.stringify({
        tipo: "outro",
        resumo: "Documento simples.",
        pontos_de_atencao: ["Cláusula inexistente"],
      }),
    });
    await expect(new AnalisadorGemini().analisar("Documento simples."))
      .rejects.toMatchObject({ statusHttp: 502 });
  });

  it("rejeita JSON inválido antes de salvar", async () => {
    simularResposta.mockResolvedValue({ text: "não é JSON" });
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 502 });
  });

  it("trata falta de chave sem chamar o provedor", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 503 });
    expect(simularResposta).not.toHaveBeenCalled();
  });

  it("trata limite de requisições do provedor", async () => {
    simularResposta.mockRejectedValue({ status: 429 });
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 503 });
  });

  it("trata erro de autenticação do provedor", async () => {
    simularResposta.mockRejectedValue({ status: 401 });
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 502 });
  });

  it("trata timeout do provedor", async () => {
    const error = new Error("tempo esgotado");
    error.name = "TimeoutError";
    simularResposta.mockRejectedValue(error);
    await expect(new AnalisadorGemini().analisar("Texto de teste."))
      .rejects.toMatchObject({ statusHttp: 504 });
  });
});
