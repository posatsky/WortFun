export interface WordPair {
  id: string;
  german: string;
  ukrainian: string;
  exampleGerman?: string;
  exampleUkrainian?: string;
}

export interface WordLevel {
  id: string;
  levelNumber: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2';
  isCustom?: boolean;
  createdAt?: number;
  pairs: WordPair[];
}

export interface GameCard {
  id: string; // Unique card id (e.g., 'pair1-de' or 'pair1-uk')
  pairId: string; // Refers to WordPair.id
  text: string;
  language: 'de' | 'uk';
  exampleGerman?: string;
  exampleUkrainian?: string;
  isSelected: boolean;
  isMatched: boolean;
  isError: boolean;
  isCorrect?: boolean;
}

export interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  totalMatched: number;
  totalAttempts: number;
  startTime: number | null;
  elapsedTime: number;
}

export interface LevelProgress {
  levelId: string;
  completed: boolean;
  stars: number; // 1 to 3
  bestScore: number;
  bestTimeSeconds: number;
}
