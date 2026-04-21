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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a set of 15 English practice questions for B1 level students.
      The set MUST include:
      - 10 Grammar/Vocabulary questions focused on Present Simple (third person singular, questions, negatives) and Verb To Be. These should be Multiple Choice with 4 options.
      - 5 Reading Comprehension questions based on ONE short passage. These should be True/False questions.
      
      Format the output as a JSON array of objects. 
      Important: ensure natural spoken English style. Avoid simple repetitive patterns.`,
            },
          ],
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: response.text || "[]",
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate questions" }),
    };
  }
};
