
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

  return <Outlet />;
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
