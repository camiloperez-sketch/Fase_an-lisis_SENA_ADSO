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
      throw new Error("Failed to fetch from server");
    }
    return await response.json();
  } catch (e) {
    console.error("Failed to generate questions via server", e);
    return [];
  }
}
