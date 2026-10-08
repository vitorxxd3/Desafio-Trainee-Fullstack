
import { z } from "zod";

export const documentoSchema = z.object({
  titulo: z
    .string()
    .refine(
      (valor) => !/^\s*$/.test(valor),
      "O título é obrigatório."
    )
    .refine(
      (valor) => Array.from(valor).length <= 200,
      "O título deve ter até 200 caracteres."
    ),

  conteudo: z
    .string()
    .refine(
      (valor) => !/^\s*$/.test(valor),
      "O conteúdo é obrigatório."
    )
    .refine(
      (valor) => Array.from(valor).length <= 50000,
      "O conteúdo deve ter até 50.000 caracteres."
    ),
});

export type DocumentoInput = z.infer<
  typeof documentoSchema
>;
