
import { Router } from "express";

import {
  cadastro,
  login,
} from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/cadastro", cadastro);
authRoutes.post("/login", login);
