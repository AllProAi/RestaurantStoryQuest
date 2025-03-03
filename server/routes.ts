import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertResponseSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.post("/api/responses", async (req, res) => {
    try {
      const data = insertResponseSchema.parse(req.body);
      const response = await storage.createResponse(data);
      res.json(response);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/responses/:id", async (req, res) => {
    const response = await storage.getResponse(parseInt(req.params.id));
    if (!response) {
      res.status(404).json({ error: "Response not found" });
      return;
    }
    res.json(response);
  });

  const httpServer = createServer(app);
  return httpServer;
}
