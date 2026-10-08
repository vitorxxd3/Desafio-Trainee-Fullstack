
export type TipoDocumento =
  | "contrato"
  | "peticao"
  | "decisao"
  | "notificacao"
  | "outro";

export interface ResultadoAnalise {
  tipo: TipoDocumento;
  resumo: string;
  pontos_de_atencao: string[];
}

export interface Analisador {
  analisar(
    conteudo: string
  ): ResultadoAnalise | Promise<ResultadoAnalise>;
}
