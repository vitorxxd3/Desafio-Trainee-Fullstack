
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";

export function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    if (nome.length > 100) {
      setErro("O nome deve ter até 100 caracteres.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      await api.post("/auth/cadastro", {
        nome,
        email,
        senha,
      });

      navigate("/login", {
        replace: true,
        state: { cadastroConcluido: true },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(
          error.response?.data?.mensagem ??
          "Não foi possível realizar o cadastro."
        );
      } else {
        setErro("Ocorreu um erro inesperado.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>Criar conta</h1>

        <p className="subtitle">
          Cadastre-se para utilizar o analisador
          de documentos.
        </p>

        <form onSubmit={handleCadastro}>
          <label htmlFor="nome">Nome completo</label>

          <input
            id="nome"
            type="text"
            placeholder="Digite seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={100}
            required
          />

          <label htmlFor="email">E-mail</label>

          <input
            id="email"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="senha">Senha</label>

          <input
            id="senha"
            type="password"
            placeholder="Mínimo de 8 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={8}
            required
          />

          {erro && (
            <p className="mensagem-erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando
              ? "Cadastrando..."
              : "Criar conta"}
          </button>

          <p>
            Já possui uma conta?{" "}
            <Link to="/login">Entrar</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
