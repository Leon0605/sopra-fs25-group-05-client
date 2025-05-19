export interface FlashcardSet {
  flashcardSetId: string;
  flashcardSetName: string;
  language: string;
  learningLanguage: string;
  flashcardQuantity: number;
  statistic: {
    NotTrained: number;
    Correct: number;
    Wrong: number;
  };
}
