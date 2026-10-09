
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";

interface DocumentoDetalhe {
  id: number;
  titulo: string;
  conteudo: string;
  autor: {
    id: number;
    nome: string;
  };
}

export function DocumentoForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const editando = Boolean(id);

  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(editando);

  useEffect(() => {
    if (!id) return;

    let ativo = true;

    async function carregarDocumento() {
      try {
        const response = await api.get<DocumentoDetalhe>(
          `/documentos/${id}`
        );

        if (!ativo) return;

        const usuario = JSON.parse(
          sessionStorage.getItem("usuario") || "null"
        ) as { id: number } | null;

        if (response.data.autor.id !== usuario?.id) {
          setErro("Você não tem permissão para editar este documento.");
          return;
        }

        setTitulo(response.data.titulo);
        setConteudo(response.data.conteudo);
      } catch (error) {
        if (!ativo) return;

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          sessionStorage.clear();
          navigate("/login", { replace: true });
          return;
        }

        setErro("Não foi possível carregar o documento.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarDocumento();

    return () => {
      ativo = false;
    };
  }, [id, navigate]);

  const quantidadeTitulo = Array.from(titulo).length;
  const quantidadeConteudo = Array.from(conteudo).length;

  async function salvarDocumento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");

    if (/^\s*$/.test(titulo) || quantidadeTitulo > 200) {
      setErro("Informe um título válido de até 200 caracteres.");
      return;
    }

    if (/^\s*$/.test(conteudo) || quantidadeConteudo > 50000) {
      setErro("Informe um conteúdo válido de até 50.000 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      const dados = { titulo, conteudo };

      if (editando) {
        await api.put(`/documentos/${id}`, dados);
      } else {
        await api.post("/documentos", dados);
      }

      navigate("/documentos", { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErro(
          error.response?.data?.mensagem ??
          "Não foi possível salvar o documento."
        );
      } else {
        setErro("Ocorreu um erro inesperado.");
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <main className="pagina-documentos">Carregando documento...</main>;
  }

  return (
    <main className="pagina-documentos">
      <Link to="/documentos">← Voltar aos documentos</Link>

      <h1>{editando ? "Editar documento" : "Novo documento"}</h1>

      <form className="formulario-documento" onSubmit={salvarDocumento}>
        <label htmlFor="titulo">Título do documento</label>

        <input
          id="titulo"
          type="text"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Ex.: Contrato de locação residencial"
          required
        />

        <small>{quantidadeTitulo}/200 caracteres</small>

        <label htmlFor="conteudo">Conteúdo do documento</label>

        <textarea
          id="conteudo"
          rows={14}
          value={conteudo}
          onChange={(event) => setConteudo(event.target.value)}
          placeholder="Digite ou cole o texto jurídico aqui..."
          required
        />

        <small>{quantidadeConteudo}/50.000 caracteres</small>

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="acoes-formulario">
          <Link to="/documentos">Cancelar</Link>

          <button
            type="submit"
            disabled={salvando || (editando && Boolean(erro))}
          >
            {salvando ? "Salvando..." : "Salvar documento"}
          </button>
        </div>
      </form>
    </main>
  );
}
