import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getFavoriteWords, removeFavoriteWord, updateFavoriteNote } from '../../db/words';
import { useFontSize } from '../_layout';

interface WordDefinition {
  definition: string;
  examples: string[];
}

interface WordData {
  definitions: WordDefinition[];
  fl: string;
  meta: {
    id: string;
  };
}

interface FavoriteWord {
  id: number;
  word: string;
  meanings: WordData | WordData[];
  note: string;
}

export default function FavoritesScreen() {
  const { fontScale } = useFontSize();
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);
  const [meaningIndex, setMeaningIndex] = useState<{ [key: number]: number }>({});
  const [noteDrafts, setNoteDrafts] = useState<{ [key: number]: string }>({});
  const [editingNoteWord, setEditingNoteWord] = useState<FavoriteWord | null>(null);

  const loadFavorites = useCallback(() => {
    try {
      const words = getFavoriteWords();
      setFavorites(words);
      setNoteDrafts((currentDrafts) => {
        const nextDrafts: { [key: number]: string } = {};
        words.forEach((word) => {
          nextDrafts[word.id] = currentDrafts[word.id] ?? word.note;
        });
        return nextDrafts;
      });
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemoveFavorite = (word: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove "${word}" from favorites?`,
      [
        { text: 'Cancel', onPress: () => { }, style: 'cancel' },
        {
          text: 'Remove',
          onPress: () => {
            removeFavoriteWord(word);
            loadFavorites();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveNote = (id: number) => {
    updateFavoriteNote(id, noteDrafts[id] ?? '');
    setEditingNoteWord(null);
    loadFavorites();
  };

  const openNoteEditor = (word: FavoriteWord) => {
    setNoteDrafts({ ...noteDrafts, [word.id]: word.note });
    setEditingNoteWord(word);
  };

  const renderWord = ({ item }: { item: FavoriteWord }) => {
    const isExpanded = expandedWordId === item.id;
    const currentMeaningIdx = meaningIndex[item.id] || 0;
    const meaningsArray = Array.isArray(item.meanings) ? item.meanings : [item.meanings];
    const currentMeaning = meaningsArray && meaningsArray[currentMeaningIdx];

    return (
      <View style={styles.wordCard}>
        <View style={styles.wordHeader}>
          <TouchableOpacity
            onPress={() => {
              setExpandedWordId(isExpanded ? null : item.id);
            }}
            style={styles.wordTitleContainer}
          >
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              color="#333"
              size={20}
              style={styles.chevron}
            />
            <Text style={[styles.wordTitle, { fontSize: 20 * fontScale }]}>{item.word}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item.word)}
            style={styles.removeButton}
          >
            <Ionicons name="heart-dislike" color="#d32f2f" size={24} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => openNoteEditor(item)}
          style={styles.noteButton}
          accessibilityLabel={`${item.note ? 'Edit' : 'Add'} note for ${item.word}`}
        >
          <Ionicons name={item.note ? 'create-outline' : 'add-circle-outline'} color="#333" size={20} />
          <Text style={[styles.noteButtonText, { fontSize: 14 * fontScale }]}>
            {item.note ? 'Edit note' : 'Add note'}
          </Text>
        </TouchableOpacity>

        {item.note ? (
          <View style={styles.noteDisplay}>
            <Text style={[styles.noteLabel, { fontSize: 11 * fontScale }]}>Your note</Text>
            <Text style={[styles.notePreview, { fontSize: 13 * fontScale }]} numberOfLines={2}>
              {item.note}
            </Text>
          </View>
        ) : null}

        {isExpanded && (
          <View style={styles.meaningsContainer}>
            {!meaningsArray || meaningsArray.length === 0 ? (
              <Text style={styles.noDefinitionsText}>No definitions available</Text>
            ) : (
              <>
                {meaningsArray.length > 1 && (
                  <View style={styles.meaningNavigation}>
                    <TouchableOpacity
                      onPress={() => setMeaningIndex({ ...meaningIndex, [item.id]: Math.max(0, currentMeaningIdx - 1) })}
                      disabled={currentMeaningIdx === 0}
                      style={[styles.navButton, currentMeaningIdx === 0 && styles.navButtonDisabled]}
                    >
                      <Ionicons name="chevron-back" color={currentMeaningIdx === 0 ? '#ccc' : '#333'} size={20} />
                    </TouchableOpacity>
                    <Text style={[styles.meaningCounter, { fontSize: 12 * fontScale }]}>
                      Meaning {currentMeaningIdx + 1} of {meaningsArray.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setMeaningIndex({ ...meaningIndex, [item.id]: Math.min(meaningsArray.length - 1, currentMeaningIdx + 1) })}
                      disabled={currentMeaningIdx === meaningsArray.length - 1}
                      style={[styles.navButton, currentMeaningIdx === meaningsArray.length - 1 && styles.navButtonDisabled]}
                    >
                      <Ionicons name="chevron-forward" color={currentMeaningIdx === meaningsArray.length - 1 ? '#ccc' : '#333'} size={20} />
                    </TouchableOpacity>
                  </View>
                )}
                {currentMeaning && (
                  <View style={styles.meaningBlock}>
                    <Text style={[styles.partOfSpeech, { fontSize: 12 * fontScale }]}>{currentMeaning.fl}</Text>
                    {currentMeaning.definitions && currentMeaning.definitions.length > 0 && (
                      <View style={styles.definitionsContainer}>
                        {currentMeaning.definitions.map((def: WordDefinition, defIndex: number) => (
                          <View key={defIndex} style={styles.definition}>
                            <Text style={[styles.definitionText, { fontSize: 14 * fontScale }]}>{defIndex + 1}. {def.definition}</Text>
                            {def.examples && def.examples.length > 0 && (
                              <View style={styles.examplesContainer}>
                                {def.examples.map((example: string, exIndex: number) => (
                                  <Text key={exIndex} style={[styles.exampleText, { fontSize: 13 * fontScale }]}>
                                    • {example}
                                  </Text>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>No favorite words yet</Text>
          <Text style={styles.emptySubtext}>Search for words and add them to your favorites!</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderWord}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          extraData={[expandedWordId, meaningIndex]}
        />
      )}
      <Modal
        visible={editingNoteWord !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingNoteWord(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.noteModal}>
            <Text style={[styles.modalTitle, { fontSize: 20 * fontScale }]}>Note for {editingNoteWord?.word}</Text>
            <TextInput
              autoFocus
              value={editingNoteWord ? noteDrafts[editingNoteWord.id] ?? '' : ''}
              onChangeText={(note) => {
                if (editingNoteWord) setNoteDrafts({ ...noteDrafts, [editingNoteWord.id]: note });
              }}
              placeholder="Write a note"
              placeholderTextColor="#999"
              multiline
              style={[styles.modalInput, { fontSize: 15 * fontScale }]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditingNoteWord(null)} style={styles.modalButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => editingNoteWord && handleSaveNote(editingNoteWord.id)}
                style={[styles.modalButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf3ff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#12345b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#52708f',
    marginTop: 6,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffd447',
    borderColor: '#d2e2f2',
    borderWidth: 1,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf5ff',
    borderColor: '#b7cee8',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  noteButtonText: {
    color: '#174b80',
    fontWeight: '600',
    marginLeft: 8,
  },
  noteDisplay: {
    backgroundColor: '#fff9dc',
    borderColor: '#e5cf6a',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginTop: -4,
    marginBottom: 12,
  },
  noteLabel: {
    color: '#806b18',
    fontWeight: '700',
    marginBottom: 4,
  },
  notePreview: {
    color: '#5a5f68',
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 20,
  },
  noteModal: {
    backgroundColor: '#ffffff',
    borderColor: '#b7cee8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    color: '#12345b',
    fontWeight: '700',
    marginBottom: 14,
  },
  modalInput: {
    color: '#12345b',
    borderColor: '#b7cee8',
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 110,
    padding: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  modalButton: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#ffd447',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#12345b',
    fontWeight: '700',
  },
  wordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chevron: {
    marginRight: 8,
  },
  wordTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#12345b',
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  meaningsContainer: {
    gap: 12,
  },
  meaningNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#edf5ff',
    padding: 12,
    borderRadius: 6,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  meaningCounter: {
    fontSize: 12,
    color: '#52708f',
    fontWeight: '600',
  },
  meaningBlock: {
    backgroundColor: '#f7fbff',
    padding: 12,
    borderRadius: 6,
  },
  partOfSpeech: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#52708f',
    marginBottom: 8,
  },
  definitionsContainer: {
    gap: 8,
  },
  definition: {
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 14,
    color: '#12345b',
    lineHeight: 20,
  },
  examplesContainer: {
    marginTop: 6,
    marginLeft: 12,
    gap: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#52708f',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noDefinitionsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 12,
  },
});
