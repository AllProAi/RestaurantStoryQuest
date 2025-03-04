import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertResponseSchema, insertUserSchema } from "@shared/schema";
import { authenticateToken, comparePasswords, generateToken, hashPassword } from "./auth";
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
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already registered" });
      }

      const user = await storage.createUser(data);
      const token = generateToken(user);

      // Don't send password hash in response
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await comparePasswords(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Protected routes
  app.post("/api/responses", authenticateToken, async (req, res) => {
    try {
      const data = insertResponseSchema.parse(req.body);
      console.log('Creating/updating response with data:', {
        ...data,
        userId: req.user.id
      });

      const response = await storage.createOrUpdateResponse({
        ...data,
        userId: req.user.id
      });

      console.log('Response saved:', response);
      res.json(response);
    } catch (error) {
      console.error('Error creating/updating response:', error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/responses/:id", authenticateToken, async (req, res) => {
    try {
      const response = await storage.getResponse(parseInt(req.params.id));
      if (!response) {
        return res.status(404).json({ error: "Response not found" });
      }

      // Only allow users to access their own responses unless they're admin
      if (response.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(response);
    } catch (error) {
      console.error('Error fetching response:', error);
      res.status(500).json({ error: "Failed to fetch response" });
    }
  });

  app.get("/api/responses/:questionId", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching response for question:', req.params.questionId);
      const responses = await storage.getResponsesByUser(req.user.id);
      const response = responses.find(r => r.questionId === parseInt(req.params.questionId));

      if (!response) {
        return res.json(null);
      }

      res.json(response);
    } catch (error) {
      console.error('Error fetching response:', error);
      res.status(500).json({ error: "Failed to fetch response" });
    }
  });

  app.get("/api/user/responses", authenticateToken, async (req, res) => {
    try {
      console.log('Fetching responses for user:', req.user.id);
      const responses = await storage.getResponsesByUser(req.user.id);
      console.log('Found responses:', responses);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching user responses:', error);
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });

  app.delete("/api/user/responses", authenticateToken, async (req, res) => {
    try {
      await storage.deleteAllResponsesByUser(req.user.id);
      res.json({ message: "All responses deleted successfully" });
    } catch (error) {
      console.error('Error deleting responses:', error);
      res.status(500).json({ error: "Failed to delete responses" });
    }
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

  // Audio upload endpoint
  app.post("/api/upload-audio", upload.single('audio'), async (req, res) => {
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

      // Generate a unique filename
      const filename = `audio-${Date.now()}.webm`;
      const publicPath = `public/uploads/${filename}`;

      // Ensure uploads directory exists
      const dir = 'public/uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save the file
      fs.writeFileSync(publicPath, req.file.buffer);

      // Return the URL that can be used to access the file
      const audioUrl = `/uploads/${filename}`;
      console.log('Audio saved, URL:', audioUrl);
      res.json({ url: audioUrl });
    } catch (error) {
      console.error('Error saving audio:', error);
      res.status(500).json({
        error: "Failed to save audio file",
        details: error.message
      });
    }
  });

  // Add this to the existing routes
  app.get("/api/questions", async (_req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}