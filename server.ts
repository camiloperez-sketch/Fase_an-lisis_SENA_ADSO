import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy Route
  app.get("/api/generate-exam", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = `Generate a set of 15 English practice questions for B1 level students.
      The set MUST include:
      - 10 Grammar/Vocabulary questions focused on Present Simple (third person singular, questions, negatives) and Verb To Be. These should be Multiple Choice with 4 options.
      - 5 Reading Comprehension questions based on ONE short passage. These should be True/False questions.
      
      Format the output as a JSON array of objects. 
      Important: ensure natural spoken English style. Avoid simple repetitive patterns.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["id", "type", "text", "options", "correctAnswer", "category"],
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                category: { type: Type.STRING },
                readingContext: { type: Type.STRING }
              }
            }
          }
        }
      });

      res.json(JSON.parse(response.text || "[]"));
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
