import { GoogleGenAI } from "@google/genai";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { question, options, correctAnswer, category } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing API Key" }),
      };
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Act as a friendly English Grammar Teacher (B1 Level).
    Question: "${question}"
    Options: ${options.join(", ")}
    Correct Answer: "${correctAnswer}"
    Category: ${category}
    
    Explain in Spanish why the answer is correct, focusing on the grammar rules of THIRD PERSON SINGULAR (Present Simple).
    Keep it concise (max 3-4 sentences). Use bullet points for the rule.
    Add a encouraging closing phrase.`;

    const result = await model.generateContent(prompt);
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ explanation: result.response.text() }),
    };
  } catch (error) {
    console.error("Explanation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate explanation" }),
    };
  }
}
