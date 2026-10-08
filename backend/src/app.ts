
import express from "express";
import cors from "cors";
import { authRoutes } from "./routes/auth.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    mensagem: "API rodando com sucesso",
  });
});

app.use("/auth", authRoutes);
