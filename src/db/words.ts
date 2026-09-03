import { db } from './client';

export function saveFavoriteWord(word: string, meanings: unknown) {
	db.runSync(
		`
			INSERT INTO words (word, meanings, isFavorite, searchedAt)
			VALUES (?, ?, 1, ?)
			ON CONFLICT(word) DO UPDATE SET
				meanings = excluded.meanings,
				isFavorite = 1,
				searchedAt = excluded.searchedAt
		`,
		word,
		JSON.stringify(meanings),
		Date.now(),
	)
}

export function getFavoriteWords(): Array<{ id: number; word: string; meanings: any; note: string }> {
	const result = db.getAllSync(
		`
			SELECT id, word, meanings, note
			FROM words
			WHERE isFavorite = 1
			ORDER BY searchedAt DESC
		`
	)
	return result.map((row: any) => {
		const parsed = JSON.parse(row.meanings)
		return {
			id: row.id,
			word: row.word,
			meanings: parsed,
			note: row.note ?? '',
		}
	})
}

export function updateFavoriteNote(id: number, note: string) {
	db.runSync(
		`
			UPDATE words
			SET note = ?
			WHERE id = ?
		`,
		note,
		id
	)
}

export function removeFavoriteWord(word: string) {
	db.runSync(
		`
			UPDATE words
			SET isFavorite = 0
			WHERE word = ?
		`,
		word
	)
}
