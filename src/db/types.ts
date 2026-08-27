export interface MeaningEntry {
  partOfSpeech: string
  definition: string
  example?: string
}

export interface StoredWord {
  id: number
  word: string
  meanings: string // raw JSON — parse with JSON.parse()
  isFavorite: number
  searchedAt: number
}