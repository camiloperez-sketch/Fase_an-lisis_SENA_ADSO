import { GoogleGenAI, Type } from "@google/genai";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured." }),
      };
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    console.log("Requesting AI content generation...");
    
    let questions = [];
    try {
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: "Generate 10 B1 English questions as JSON array." }],
          },
        ],
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
                readingContext: { type: Type.STRING },
              },
            },
          },
        },
      });
      questions = JSON.parse(result.text || "[]");
    } catch (aiError) {
      console.error("AI Error, using fallback:", aiError);
      // HARD-CODED FALLBACK QUESTIONS TO PREVENT EMPTY SCREEN
      questions = [
        {
          id: "f1",
          type: "multiple-choice",
          text: "Well, actually... she _______ very hard for her English exam every day.",
          options: ["study", "studies", "is study", "studing"],
          correctAnswer: "studies",
          category: "grammar"
        },
        {
          id: "f2",
          type: "multiple-choice",
          text: "I mean, _______ you and your friends going to the park now?",
          options: ["is", "are", "be", "do"],
          correctAnswer: "are",
          category: "grammar"
        },
        {
          id: "f3",
          type: "true-false",
          readingContext: "Mark is a digital nomad. He works with his laptop at the beach. He starts at 9 AM.",
          text: "Mark works in a traditional office.",
          options: ["True", "False"],
          correctAnswer: "False",
          category: "reading"
        }
      ];
    }

    console.log(`Sending ${questions.length} questions to client.`);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(questions),
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate questions" }),
    };
  }
};
