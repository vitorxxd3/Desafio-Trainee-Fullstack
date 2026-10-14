import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";
import "./Documentos.css";

interface Documento {
  id: number;
  titulo: string;
  autor: { id: number; nome: string };
  criado_em: string;
  tipo: string | null;
}

interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

interface RespostaPaginada {
  dados: Documento[];
  paginacao: Paginacao;
}

type Ordem = "asc" | "desc";

export function Documentos() {
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [ordem, setOrdem] = useState<Ordem>("desc");
  const [meus, setMeus] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    limite: 10,
    total: 0,
    total_paginas: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDocumentos() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await api.get<RespostaPaginada>("/documentos", {
          params: {
            ordem,
            meus: String(meus),
            pagina,
            limite,
            ...(buscaAplicada ? { busca: buscaAplicada } : {}),
          },
        });

        if (ativo) {
          setDocumentos(resposta.data.dados);
          setPaginacao(resposta.data.paginacao);
        }
      } catch (error) {
        if (!ativo) return;

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("usuario");
          navigate("/login", { replace: true });
          return;
        }

        setErro("Não foi possível carregar os documentos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarDocumentos();
    return () => {
      ativo = false;
    };
  }, [ordem, meus, buscaAplicada, pagina, limite, navigate]);

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPagina(1);
    setBuscaAplicada(busca.trim());
  }

  function limparBusca() {
    setBusca("");
    setBuscaAplicada("");
    setPagina(1);
  }

  function sair() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    navigate("/login", { replace: true });
  }

  const totalPaginasExibido = Math.max(1, paginacao.total_paginas);

  return (
    <main className="pagina-documentos">
      <header className="cabecalho">
        <div>
          <h1>Documentos</h1>
          <p>Gerencie e analise documentos jurídicos.</p>
        </div>
        <button type="button" className="botao-sair" onClick={sair}>
          Sair
        </button>
      </header>

      <section>
        <div className="lista-cabecalho">
          <h2>Documentos cadastrados</h2>
          <Link className="botao-link" to="/documentos/novo">
            + Novo documento
          </Link>
        </div>

        <div className="filtros-documentos">
          <form className="busca-documentos" onSubmit={pesquisar}>
            <label htmlFor="busca-titulo">Buscar pelo título</label>
            <div className="busca-documentos-acoes">
              <input
                id="busca-titulo"
                type="search"
                value={busca}
                maxLength={200}
                placeholder="Ex.: contrato de locação"
                onChange={(event) => setBusca(event.target.value)}
              />
              <button type="submit">Buscar</button>
              {(busca || buscaAplicada) && (
                <button type="button" className="botao-limpar" onClick={limparBusca}>
                  Limpar
                </button>
              )}
            </div>
          </form>

          <div className="campo-ordenacao">
            <label htmlFor="ordem">Ordenar por</label>
            <select
              id="ordem"
              value={ordem}
              onChange={(event) => {
                setPagina(1);
                setOrdem(event.target.value === "asc" ? "asc" : "desc");
              }}
            >
              <option value="desc">Mais recentes primeiro</option>
              <option value="asc">Mais antigos primeiro</option>
            </select>
          </div>

          <div className="campo-ordenacao">
            <label htmlFor="limite">Itens por página</label>
            <select
              id="limite"
              value={limite}
              onChange={(event) => {
                setPagina(1);
                setLimite(Number(event.target.value));
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <label className="filtro-meus">
            <input
              type="checkbox"
              checked={meus}
              onChange={(event) => {
                setPagina(1);
                setMeus(event.target.checked);
              }}
            />
            Mostrar apenas meus documentos
          </label>
        </div>

        {carregando && <p role="status">Carregando documentos...</p>}

        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

        {!carregando && !erro && documentos.length === 0 && (
          <div className="estado-vazio">
            <h3>Nenhum documento encontrado</h3>
            <p>
              {buscaAplicada
                ? `Nenhum título corresponde à busca "${buscaAplicada}".`
                : meus
                  ? "Você ainda não cadastrou documentos."
                  : "Ainda não existem documentos cadastrados."}
            </p>
          </div>
        )}

        {!carregando && !erro && documentos.map((documento) => (
          <article className="documento-card" key={documento.id}>
            <h3>
              <Link to={`/documentos/${documento.id}`}>{documento.titulo}</Link>
            </h3>
            <p>Autor: {documento.autor.nome}</p>
            <p>
              Criado em: {new Date(documento.criado_em).toLocaleString("pt-BR")}
            </p>
            <span className="documento-tipo">
              {documento.tipo ?? "Não analisado"}
            </span>
          </article>
        ))}

        {!carregando && !erro && (
          <nav className="paginacao-documentos" aria-label="Paginação de documentos">
            <p>
              {paginacao.total} {paginacao.total === 1 ? "documento encontrado" : "documentos encontrados"}
            </p>
            <div className="paginacao-documentos-acoes">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((atual) => atual - 1)}
              >
                Anterior
              </button>
              <span>Página {pagina} de {totalPaginasExibido}</span>
              <button
                type="button"
                disabled={pagina >= paginacao.total_paginas}
                onClick={() => setPagina((atual) => atual + 1)}
              >
                Próxima
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
