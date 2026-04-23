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
  try {
    const response = await fetch("/api/generate-exam");
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Server API error:", errorData);
      throw new Error("Failed to fetch questions from server");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to generate questions via API", e);
    return [];
  }
}
