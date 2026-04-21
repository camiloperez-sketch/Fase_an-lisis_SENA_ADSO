import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  options: string[];
  correctAnswer: string;
  category: 'grammar' | 'vocabulary' | 'reading';
  readingContext?: string;
}

export async function generateExamQuestions(): Promise<QuizQuestion[]> {
  const prompt = `Generate a set of 15 English practice questions for B1 level students.
  The set MUST include:
  - 10 Grammar/Vocabulary questions focused on Present Simple (third person singular, questions, negatives) and Verb To Be. These should be Multiple Choice with 4 options.
  - 5 Reading Comprehension questions based on ONE short passage (similar to a doctor's daily routine). These should be True/False questions.
  
  Format the output as a JSON array of objects. 
  Example object for grammar:
  {
    "id": "1",
    "type": "multiple-choice",
    "text": "Sarah _______ a lot of books every month.",
    "options": ["read", "reads", "reading", "reades"],
    "correctAnswer": "reads",
    "category": "grammar"
  }
  
  Example object for reading:
  {
    "id": "11",
    "type": "true-false",
    "readingContext": "Full reading text here...",
    "text": "The main character works in a bank.",
    "options": ["Verdadero", "Falso"],
    "correctAnswer": "Falso",
    "category": "reading"
  }
  
  IMPORTANT: Do not use the same examples as the user: 'Diana washes the family car', 'Agusto Galan reading', etc. Make them fresh and natural SPOKEN ENGLISH style (fillers allowed in dialogues but keep it appropriate for B1).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
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

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
}
