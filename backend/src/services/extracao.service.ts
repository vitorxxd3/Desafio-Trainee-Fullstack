import { PDFParse } from "pdf-parse";

export class ErroExtracao extends Error {
  constructor(mensagem: string) { super(mensagem); }
}

export async function extrairTextoDoArquivo(nome: string, buffer: Buffer): Promise<string> {
  const extensao = nome.toLowerCase().split(".").pop();
  let texto: string;

  if (extensao === "txt") {
    try {
      texto = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      throw new ErroExtracao("O arquivo .txt deve estar codificado em UTF-8.");
    }
  } else if (extensao === "pdf") {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new ErroExtracao("O arquivo enviado não é um PDF válido.");
    }
    const leitor = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const resultado = await leitor.getText();
      texto = resultado.text;
    } catch {
      throw new ErroExtracao("Não foi possível extrair texto deste PDF. Verifique se ele não está protegido ou danificado.");
    } finally {
      await leitor.destroy();
    }
  } else {
    throw new ErroExtracao("Envie um arquivo .txt ou .pdf.");
  }

  if (!texto.trim()) {
    throw new ErroExtracao("O arquivo não contém texto selecionável. PDFs digitalizados precisam de OCR.");
  }
  if (Array.from(texto).length > 50_000) {
    throw new ErroExtracao("O texto extraído ultrapassa 50.000 caracteres.");
  }
  return texto;
}
