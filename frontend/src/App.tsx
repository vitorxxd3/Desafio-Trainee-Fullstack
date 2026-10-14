import { Link, NavLink } from "react-router-dom";
import { HistoricoAnalises } from "./pages/HistoricoAnalises";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { DocumentoDetalhes } from "./pages/DocumentoDetalhes";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Documentos } from "./pages/Documentos";
import { DocumentoForm } from "./pages/DocumentoForm";

function RotaProtegida() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <header className="app-navbar">
        <div className="navbar-inner">
          <Link className="app-brand" to="/documentos" aria-label="Analisador de Documentos - início">
            <span className="app-brand-mark" aria-hidden="true">▤</span>
            <span className="app-brand-name">Analisador de Documentos</span>
          </Link>
          <nav className="app-nav" aria-label="Navegação principal">
            <NavLink to="/documentos" className={({ isActive }) => isActive ? "app-nav-item is-active" : "app-nav-item"}>Documentos</NavLink>
            <NavLink to="/historico-analises" className={({ isActive }) => isActive ? "app-nav-item is-active" : "app-nav-item"}>Histórico</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

        <Route element={<RotaProtegida />}>
          <Route path="/historico-analises" element={<HistoricoAnalises />} />

          <Route
  path="/documentos/:id"
  element={<DocumentoDetalhes />}
/>

          <Route
            path="/documentos"
            element={<Documentos />}
          />

          <Route
            path="/documentos/novo"
            element={<DocumentoForm />}
          />

          <Route
            path="/documentos/:id/editar"
            element={<DocumentoForm />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
