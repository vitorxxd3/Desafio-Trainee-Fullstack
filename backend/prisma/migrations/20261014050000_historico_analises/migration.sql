-- Histórico imutável: preserva análises mesmo quando o documento é excluído.
CREATE TABLE "historico_analises" (
  "id" SERIAL NOT NULL,
  "documento_id_origem" INTEGER NOT NULL,
  "titulo_documento" VARCHAR(200) NOT NULL,
  "autor_id" INTEGER NOT NULL,
  "motivo" VARCHAR(25) NOT NULL,
  "tipo" VARCHAR(20) NOT NULL,
  "resumo" TEXT NOT NULL,
  "pontos_de_atencao" JSONB NOT NULL,
  "analisador" VARCHAR(30) NOT NULL,
  "analisada_em" TIMESTAMP(3) NOT NULL,
  "arquivada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "historico_analises_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "historico_analises_autor_id_arquivada_em_idx" ON "historico_analises"("autor_id", "arquivada_em");
CREATE INDEX "historico_analises_documento_id_origem_autor_id_idx" ON "historico_analises"("documento_id_origem", "autor_id");
ALTER TABLE "historico_analises"
  ADD CONSTRAINT "historico_analises_autor_id_fkey"
  FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
