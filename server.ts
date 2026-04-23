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

  // Grammar Agent Route
  app.post("/api/explain-grammar", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

      const { question, options, correctAnswer, category } = req.body;
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Act as a friendly English Grammar Teacher (B1 Level).
      Question: "${question}"
      Options: ${options.join(", ")}
      Correct Answer: "${correctAnswer}"
      Category: ${category}
      
      Explain in Spanish why the answer is correct, focusing on the grammar rules of THIRD PERSON SINGULAR (Present Simple).
      Highlight if it's an Affirmative (+s), Negative (doesn't), or Question (Does).
      Keep it short (max 3 sentences).`;

      const result = await model.generateContent(prompt);
      res.json({ explanation: result.response.text() });
    } catch (error) {
      console.error("Explanation error:", error);
      res.status(500).json({ error: "Failed to generate explanation" });
    }
  });

  // Gemini API Proxy Route
  app.get("/api/generate-exam", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const prompt = `Generate 20 English practice questions for B1 level.
      STRICT CONSTRAINT: All grammar questions MUST be in THIRD PERSON SINGULAR (He, She, It).
      - Include Affirmative (e.g., He works), Negative (e.g., She doesn't like), and Question (e.g., Does it start?) forms of Present Simple.
      - 14 Grammar questions (Mixed forms)
      - 6 Reading Comprehension questions (Short passage).
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
        // FULL FALLBACK SET OF 20 QUESTIONS - STRICT 3RD PERSON
        questions = [
          { id: "f1", type: "multiple-choice", text: "He ______ in a big office downtown.", options: ["work", "works", "don't work", "working"], correctAnswer: "works", category: "grammar" },
          { id: "f2", type: "multiple-choice", text: "Actually, she ______ like drinking tea in the morning.", options: ["don't", "is", "doesn't", "isn't"], correctAnswer: "doesn't", category: "grammar" },
          { id: "f3", type: "multiple-choice", text: "______ your father drive to work every day?", options: ["Do", "Is", "Does", "Are"], correctAnswer: "Does", category: "grammar" },
          { id: "f4", type: "multiple-choice", text: "It ______ start until 9:00 PM.", options: ["doesn't", "don't", "isn't", "not"], correctAnswer: "doesn't", category: "grammar" },
          { id: "f5", type: "multiple-choice", text: "She ______ a very talented musician.", options: ["am", "is", "are", "be"], correctAnswer: "is", category: "grammar" },
          { id: "f6", type: "multiple-choice", text: "The cat ______ sleep on the sofa; it sleeps on the bed.", options: ["don't", "is", "doesn't", "no"], correctAnswer: "doesn't", category: "grammar" },
          { id: "f7", type: "multiple-choice", text: "______ she study for her B1 exam on weekends?", options: ["Do", "Does", "Is", "Are"], correctAnswer: "Does", category: "grammar" },
          { id: "f8", type: "multiple-choice", text: "The bus ______ arrive on time today.", options: ["didn't", "don't", "doesn't", "isn't"], correctAnswer: "doesn't", category: "grammar" },
          { id: "f9", type: "multiple-choice", text: "He ______ any brothers or sisters.", options: ["don't have", "doesn't has", "doesn't have", "no have"], correctAnswer: "doesn't have", category: "grammar" },
          { id: "f10", type: "multiple-choice", text: "______ it rain a lot in London?", options: ["Do", "Does", "Is", "Has"], correctAnswer: "Does", category: "grammar" },
          { id: "f11", type: "multiple-choice", text: "Well, the new student ______ very shy.", options: ["are", "am", "is", "be"], correctAnswer: "is", category: "grammar" },
          { id: "f12", type: "multiple-choice", text: "The restaurant ______ open on Mondays.", options: ["isn't", "aren't", "don't", "doesn't"], correctAnswer: "doesn't", category: "grammar" },
          { id: "f13", type: "multiple-choice", text: "______ your sister speak English fluently?", options: ["Does", "Do", "Is", "Are"], correctAnswer: "Does", category: "grammar" },
          { id: "f14", type: "multiple-choice", text: "Actually, the baby ______ milk every three hours.", options: ["drink", "drinks", "drinking", "don't drink"], correctAnswer: "drinks", category: "grammar" },
          { id: "f15", type: "true-false", readingContext: "Mark is an astronaut. He lives on a space station. He eats special food.", text: "Mark works in a school.", options: ["True", "False"], correctAnswer: "False", category: "reading" },
          { id: "f16", type: "true-false", readingContext: "Mark is an astronaut. He lives on a space station. He eats special food.", text: "He lives in space.", options: ["True", "False"], correctAnswer: "True", category: "reading" },
          { id: "f17", type: "true-false", readingContext: "Emily is a writer. She writes historical novels at night.", text: "Emily is a doctor.", options: ["True", "False"], correctAnswer: "False", category: "reading" },
          { id: "f18", type: "true-false", readingContext: "Emily is a writer. She writes historical novels at night.", text: "She writes at night.", options: ["True", "False"], correctAnswer: "True", category: "reading" },
          { id: "f19", type: "true-false", readingContext: "The robot helps people. It doesn't need sleep or food.", text: "The robot needs to sleep.", options: ["True", "False"], correctAnswer: "False", category: "reading" },
          { id: "f20", type: "true-false", readingContext: "The robot helps people. It doesn't need sleep or food.", text: "It works for people.", options: ["True", "False"], correctAnswer: "True", category: "reading" }
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
