import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentoForm } from "./DocumentoForm";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

function tela() {
  return render(
    <MemoryRouter initialEntries={["/documentos/novo"]}>
      <Routes>
        <Route path="/documentos/novo" element={<DocumentoForm />} />
        <Route path="/documentos" element={<div>Lista de documentos</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Formulário de documentos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("importa um TXT e preenche o conteúdo sem salvar automaticamente", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { conteudo: "Contrato fictício extraído." } } as never);
    tela();
    const campo = screen.getByLabelText(/Importar arquivo/i);
    fireEvent.change(campo, {
      target: { files: [new File(["Contrato fictício extraído."], "contrato.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByDisplayValue("Contrato fictício extraído.")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      "/documentos/extrair-texto", expect.any(FormData), expect.any(Object)
    );
    expect(screen.getByRole("button", { name: /Salvar documento/i })).toBeEnabled();
  });

  it("não aceita arquivo maior que 5MB", async () => {
    tela();
    fireEvent.change(screen.getByLabelText(/Importar arquivo/i), {
      target: { files: [new File(["a".repeat(5 * 1024 * 1024 + 1)], "grande.txt")] },
    });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("5 MB"));
    expect(api.post).not.toHaveBeenCalled();
  });
});
