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
            parts: [{ text: "Generate 20 B1 English questions (14 grammar/vocab, 6 reading) strictly in THIRD PERSON SINGULAR (He/She/It) for grammar. Include affirmative, negative, and question forms. Output as JSON array." }],
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
