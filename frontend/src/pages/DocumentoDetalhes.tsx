
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";

interface Analise {
  tipo: string;
  resumo: string;
  pontos_de_atencao: string[];
  analisador: string;
  criado_em: string;
}

interface DocumentoDetalhe {
  id: number;
  titulo: string;
  conteudo: string;
  autor: {
    id: number;
    nome: string;
  };
  criado_em: string;
  atualizado_em: string;
  analise: Analise | null;
}

function obterUsuarioId(): number | null {
  try {
    const salvo = sessionStorage.getItem("usuario");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);
    return typeof usuario.id === "number"
      ? usuario.id
      : null;
  } catch {
    return null;
  }
}

export function DocumentoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documento, setDocumento] =
    useState<DocumentoDetalhe | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [analisando, setAnalisando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  const usuarioId = obterUsuarioId();

  const ehAutor =
    documento !== null &&
    documento.autor.id === usuarioId;

  useEffect(() => {
    let ativo = true;

    async function carregarDocumento() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await api.get<DocumentoDetalhe>(
          `/documentos/${id}`
        );

        if (ativo) setDocumento(resposta.data);
      } catch (error) {
        if (!ativo) return;

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("usuario");
          navigate("/login", { replace: true });
          return;
        }

        setErro(
          axios.isAxiosError(error)
            ? error.response?.data?.mensagem ??
                "Erro ao carregar documento."
            : "Erro inesperado."
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarDocumento();

    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  async function analisarDocumento() {
    if (!ehAutor) return;

    setAnalisando(true);
    setErro("");

    try {
      await api.post(`/documentos/${id}/analise`);

      const resposta = await api.get<DocumentoDetalhe>(
        `/documentos/${id}`
      );

      setDocumento(resposta.data);
    } catch (error) {
      setErro(
        axios.isAxiosError(error)
          ? error.response?.data?.mensagem ??
              "Não foi possível analisar o documento."
          : "Erro inesperado."
      );
    } finally {
      setAnalisando(false);
    }
  }

  async function excluirDocumento() {
    if (!ehAutor) return;

    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
    );

    if (!confirmou) return;

    setExcluindo(true);
    setErro("");

    try {
      await api.delete(`/documentos/${id}`);

      navigate("/documentos", { replace: true });
    } catch (error) {
      setErro(
        axios.isAxiosError(error)
          ? error.response?.data?.mensagem ??
              "Não foi possível excluir o documento."
          : "Erro inesperado."
      );
    } finally {
      setExcluindo(false);
    }
  }

  if (carregando) {
    return (
      <main className="pagina-documentos">
        <p>Carregando documento...</p>
      </main>
    );
  }

  if (!documento) {
    return (
      <main className="pagina-documentos">
        <Link to="/documentos">← Voltar</Link>
        <p role="alert">{erro || "Documento não encontrado."}</p>
      </main>
    );
  }

  return (
    <main className="pagina-documentos">
      <Link to="/documentos">← Voltar aos documentos</Link>

      <div className="detalhes-cabecalho">
        <div>
          <h1>{documento.titulo}</h1>
          <p>Autor: {documento.autor.nome}</p>

          <p>
            Criado em:{" "}
            {new Date(documento.criado_em).toLocaleString("pt-BR")}
          </p>

          <p>
            Atualizado em:{" "}
            {new Date(documento.atualizado_em).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {ehAutor && (
        <div className="detalhes-acoes">
          <Link
            className="botao-link"
            to={`/documentos/${id}/editar`}
          >
            Editar
          </Link>

          <button
            type="button"
            onClick={() => void analisarDocumento()}
            disabled={analisando || excluindo}
          >
            {analisando
              ? "Analisando..."
              : "Analisar documento"}
          </button>

          <button
            type="button"
            className="botao-excluir"
            onClick={() => void excluirDocumento()}
            disabled={excluindo || analisando}
          >
            {excluindo ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      )}

      {erro && (
        <p className="mensagem-erro" role="alert">
          {erro}
        </p>
      )}

      <section className="detalhes-secao">
        <h2>Conteúdo do documento</h2>
        <div className="documento-conteudo">
          {documento.conteudo}
        </div>
      </section>

      <section className="detalhes-secao">
        <h2>Análise do documento</h2>

        {!documento.analise ? (
          <p>Este documento ainda não foi analisado.</p>
        ) : (
          <div className="resultado-analise">
            <h3>Classificação</h3>
            <p>{documento.analise.tipo}</p>

            <h3>Resumo</h3>
            <p>{documento.analise.resumo}</p>

            <h3>Pontos de atenção</h3>

            {documento.analise.pontos_de_atencao.length === 0 ? (
              <p>Nenhum ponto de atenção identificado.</p>
            ) : (
              <ul>
                {documento.analise.pontos_de_atencao.map(
                  (ponto, indice) => (
                    <li key={indice}>{ponto}</li>
                  )
                )}
              </ul>
            )}

            <p className="analise-metadata">
              Analisador: {documento.analise.analisador}
            </p>

            <p className="analise-metadata">
              Analisado em:{" "}
              {new Date(
                documento.analise.criado_em
              ).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
