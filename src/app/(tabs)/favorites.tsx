import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFavoriteWords, removeFavoriteWord } from '../../db/words';

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
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteWord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);
  const [meaningIndex, setMeaningIndex] = useState<{ [key: number]: number }>({});

  const loadFavorites = useCallback(() => {
    try {
      const words = getFavoriteWords();
      setFavorites(words);
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
            <Text style={styles.wordTitle}>{item.word}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item.word)}
            style={styles.removeButton}
          >
            <Ionicons name="heart-dislike" color="#d32f2f" size={24} />
          </TouchableOpacity>
        </View>

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
                    <Text style={styles.meaningCounter}>
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
                    <Text style={styles.partOfSpeech}>{currentMeaning.fl}</Text>
                    {currentMeaning.definitions && currentMeaning.definitions.length > 0 && (
                      <View style={styles.definitionsContainer}>
                        {currentMeaning.definitions.map((def: WordDefinition, defIndex: number) => (
                          <View key={defIndex} style={styles.definition}>
                            <Text style={styles.definitionText}>{defIndex + 1}. {def.definition}</Text>
                            {def.examples && def.examples.length > 0 && (
                              <View style={styles.examplesContainer}>
                                {def.examples.map((example: string, exIndex: number) => (
                                  <Text key={exIndex} style={styles.exampleText}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffd33d',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#333',
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
    backgroundColor: '#fff',
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
    color: '#666',
    fontWeight: '600',
  },
  meaningBlock: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  partOfSpeech: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
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
    color: '#333',
    lineHeight: 20,
  },
  examplesContainer: {
    marginTop: 6,
    marginLeft: 12,
    gap: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#666',
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
