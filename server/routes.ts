import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertResponseSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import fs from 'fs';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize OpenAI with API key from server environment
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

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

  // Audio transcription endpoint
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        console.error('No audio file received');
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log('Received audio file:', {
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname
      });

      // Create a temporary file
      const tempFile = `temp-${Date.now()}.webm`;
      fs.writeFileSync(tempFile, req.file.buffer);

      try {
        console.log('Sending file to OpenAI for transcription...');
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: 'whisper-1',
        });

        console.log('Transcription result:', transcription.text);
        res.json({ text: transcription.text });
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        error: "Failed to transcribe audio",
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}