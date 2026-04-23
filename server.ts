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
      
      const prompt = `Generate 10 English practice questions for B1 level.
      - 7 Grammar/Vocabulary (Present Simple & Verb To Be)
      - 3 Reading Comprehension (Short passage)
      Output format: JSON array of objects.`;

      let questions = [];
      try {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
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
        questions = JSON.parse(response.text || "[]");
      } catch (aiError) {
        console.error("AI Error in server.ts, using fallback:", aiError);
        questions = [
          {
            id: "f1",
            type: "multiple-choice",
            text: "Actually, he _______ to the gym every morning before work.",
            options: ["go", "goes", "is go", "going"],
            correctAnswer: "goes",
            category: "grammar"
          },
          {
            id: "f2",
            type: "true-false",
            readingContext: "Emily is a freelance photographer. She works from home and loves traveling.",
            text: "Emily works in a bank.",
            options: ["True", "False"],
            correctAnswer: "False",
            category: "reading"
          }
        ];
      }

      res.json(questions);
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
