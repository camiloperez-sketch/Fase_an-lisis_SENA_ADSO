export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  options: string[];
  correctAnswer: string;
  category: 'grammar' | 'vocabulary' | 'reading';
  readingContext?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isFinished: boolean;
  questions: QuizQuestion[];
  timeLeft: number; // in seconds
}
