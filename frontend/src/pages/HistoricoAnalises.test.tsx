import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { HistoricoAnalises } from "./HistoricoAnalises";
import { api } from "../services/api";

vi.mock("../services/api", () => ({ api: { get: vi.fn() } }));

describe("Histórico", () => {
  it("apresenta análises arquivadas mesmo para um documento excluído", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{
      id: 4,
      documento_id_origem: 3,
      titulo_documento: "Contrato excluído",
      motivo: "DOCUMENTO_EXCLUIDO",
      tipo: "contrato",
      resumo: "Acordo fictício.",
      pontos_de_atencao: ["Existe multa."],
      analisador: "regras",
      analisada_em: "2026-10-14T10:00:00.000Z",
      arquivada_em: "2026-10-14T10:01:00.000Z",
    }] } as never);
    render(<MemoryRouter><HistoricoAnalises /></MemoryRouter>);
    expect(await screen.findByText("Contrato excluído")).toBeInTheDocument();
    expect(screen.getByText(/Arquivada após exclusão do documento/i)).toBeInTheDocument();
    expect(screen.getByText("Acordo fictício.")).toBeInTheDocument();
  });
});
