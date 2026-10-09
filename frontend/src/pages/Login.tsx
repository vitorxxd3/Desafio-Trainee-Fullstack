
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export function Login() {
  const navigate = useNavigate();
    const rotaLocation = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        { email, senha }
      );

      sessionStorage.setItem(
        "token",
        response.data.token
      );

      sessionStorage.setItem(
        "usuario",
        JSON.stringify(response.data.usuario)
      );

      navigate("/documentos", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(
          error.response?.data?.mensagem ??
          "Não foi possível realizar o login."
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
        <h1>Analisador de Documentos</h1>

        <p className="subtitle">
          Entre na sua conta para continuar
        </p>
        

{rotaLocation.state?.cadastroConcluido && (
  <p className="mensagem-sucesso" role="status">
    Cadastro realizado com sucesso! Faça login para continuar.
  </p>
)}


        <form onSubmit={handleLogin}>
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
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && (
            <p className="mensagem-erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
        
<p>
  Ainda não possui uma conta?{" "}
  <Link to="/cadastro">Cadastre-se</Link>
</p>

      </div>
    </main>
  );
}
