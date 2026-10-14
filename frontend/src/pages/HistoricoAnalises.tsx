import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../services/api";

interface RegistroHistorico {
  id: number;
  documento_id_origem: number;
  titulo_documento: string;
  motivo: "SUBSTITUIDA" | "CONTEUDO_ALTERADO" | "DOCUMENTO_EXCLUIDO";
  tipo: string;
  resumo: string;
  pontos_de_atencao: string[];
  analisador: string;
  analisada_em: string;
  arquivada_em: string;
}

const legendaMotivo = {
  SUBSTITUIDA: "Substituída por nova análise",
  CONTEUDO_ALTERADO: "Arquivada após alteração do conteúdo",
  DOCUMENTO_EXCLUIDO: "Arquivada após exclusão do documento",
};

export function HistoricoAnalises() {
  const navigate = useNavigate();
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await api.get<RegistroHistorico[]>("/historico-analises");
        if (ativo) setHistorico(resposta.data);
      } catch (error) {
        if (!ativo) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("usuario");
          navigate("/login", { replace: true });
          return;
        }
        setErro("Não foi possível carregar o histórico de análises.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [navigate]);

  return (
    <main className="pagina-documentos">
      <Link to="/documentos">← Voltar aos documentos</Link>
      <h1>Histórico de análises</h1>
      <p>Últimas 100 análises arquivadas de documentos criados por você. O histórico permanece mesmo após excluir um documento.</p>
      {carregando && <p role="status">Carregando histórico...</p>}
      {erro && <p role="alert" className="mensagem-erro">{erro}</p>}
      {!carregando && !erro && historico.length === 0 && <p>Nenhuma análise arquivada até agora.</p>}
      {!carregando && !erro && historico.map(item => (
        <article key={item.id} className="detalhes-secao">
          <h2>{item.titulo_documento}</h2>
          <p><strong>Motivo:</strong> {legendaMotivo[item.motivo]}</p>
          <p><strong>Tipo:</strong> {item.tipo} — <strong>Analisador:</strong> {item.analisador}</p>
          <p><strong>Analisada em:</strong> {new Date(item.analisada_em).toLocaleString("pt-BR")}</p>
          <p><strong>Arquivada em:</strong> {new Date(item.arquivada_em).toLocaleString("pt-BR")}</p>
          <h3>Resumo</h3>
          <p>{item.resumo}</p>
          <h3>Pontos de atenção</h3>
          {item.pontos_de_atencao.length ? (
            <ul>{item.pontos_de_atencao.map((p, i) => <li key={i}>{p}</li>)}</ul>
          ) : <p>Nenhum ponto identificado.</p>}
        </article>
      ))}
    </main>
  );
}
