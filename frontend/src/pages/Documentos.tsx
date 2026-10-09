
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { api } from "../services/api";

interface Documento {
  id: number;
  titulo: string;
  autor: {
    id: number;
    nome: string;
  };
  criado_em: string;
  tipo: string | null;
}

type Ordem = "asc" | "desc";

export function Documentos() {
  const navigate = useNavigate();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [ordem, setOrdem] = useState<Ordem>("desc");
  const [meus, setMeus] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDocumentos() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await api.get<Documento[]>(
          "/documentos",
          {
            params: {
              ordem,
              meus: String(meus),
            },
          }
        );

        if (ativo) {
          setDocumentos(resposta.data);
        }
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

        setErro("Não foi possível carregar os documentos.");
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarDocumentos();

    return () => {
      ativo = false;
    };
  }, [ordem, meus, navigate]);

  function sair() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");

    navigate("/login", { replace: true });
  }

  return (
    <main className="pagina-documentos">
      <header className="cabecalho">
        <div>
          <h1>Documentos</h1>
          <p>Gerencie e analise documentos jurídicos.</p>
        </div>

        <button
          type="button"
          className="botao-sair"
          onClick={sair}
        >
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
          <div className="campo-ordenacao">
            <label htmlFor="ordem">
              Ordenar por
            </label>

            <select
              id="ordem"
              value={ordem}
              onChange={(event) =>
                setOrdem(
                  event.target.value === "asc"
                    ? "asc"
                    : "desc"
                )
              }
            >
              <option value="desc">
                Mais recentes primeiro
              </option>

              <option value="asc">
                Mais antigos primeiro
              </option>
            </select>
          </div>

          <label className="filtro-meus">
            <input
              type="checkbox"
              checked={meus}
              onChange={(event) =>
                setMeus(event.target.checked)
              }
            />

            Mostrar apenas meus documentos
          </label>
        </div>

        {carregando && (
          <p role="status">Carregando documentos...</p>
        )}

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        {!carregando && !erro && documentos.length === 0 && (
          <div className="estado-vazio">
            <h3>Nenhum documento encontrado</h3>

            <p>
              {meus
                ? "Você ainda não cadastrou documentos."
                : "Ainda não existem documentos cadastrados."}
            </p>
          </div>
        )}

        {!carregando &&
          !erro &&
          documentos.map((documento) => (
            <article
              className="documento-card"
              key={documento.id}
            >
              <h3>
                <Link to={`/documentos/${documento.id}`}>
                  {documento.titulo}
                </Link>
              </h3>

              <p>Autor: {documento.autor.nome}</p>

              <p>
                Criado em:{" "}
                {new Date(
                  documento.criado_em
                ).toLocaleString("pt-BR")}
              </p>

              <span className="documento-tipo">
                {documento.tipo ?? "Não analisado"}
              </span>
            </article>
          ))}
      </section>
    </main>
  );
}
