
import { z } from "zod";

export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "O nome é obrigatório.")
    .max(100, "O nome deve ter até 100 caracteres."),

  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase()),

  senha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export type CadastroInput = z.infer<
  typeof cadastroSchema
>;


export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase()),

  senha: z
    .string()
    .min(1, "A senha é obrigatória."),
});

export type LoginInput = z.infer<typeof loginSchema>;
