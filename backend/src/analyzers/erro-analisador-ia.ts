/** Falhas controladas da integração externa, sem exposição de credenciais. */
export class ErroAnalisadorIA extends Error {
  constructor(
    public readonly statusHttp: 502 | 503 | 504,
    mensagem: string
  ) {
    super(mensagem);
    this.name = "ErroAnalisadorIA";
  }
}
