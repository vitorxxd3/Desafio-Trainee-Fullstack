
import { Router } from "express";
import { gerarAnalise } from "../controllers/analise.controller.js";
import { autenticar } from "../middlewares/auth.middleware.js";

import {
  listarDocumentos,
  cadastrarDocumento,
  detalharDocumento,
  editarDocumento,
  excluirDocumento,
} from "../controllers/documentos.controller.js";

export const documentosRoutes = Router();


documentosRoutes.use(autenticar);


documentosRoutes.get("/", listarDocumentos);


documentosRoutes.post("/", cadastrarDocumento);


documentosRoutes.get("/:id", detalharDocumento);


documentosRoutes.put("/:id", editarDocumento);


documentosRoutes.delete("/:id", excluirDocumento);


documentosRoutes.post("/:id/analise", gerarAnalise);
