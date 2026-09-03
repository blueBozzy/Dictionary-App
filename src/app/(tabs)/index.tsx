import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveFavoriteWord } from '../../db/words';
import { useFontSize } from '../_layout';

interface definitionData {
  definition: string;
  examples: string[];
}

interface wordData {
  definitions: definitionData[];
  fl: string;
  meta: {
    id: string;
  };
}

function stripMarkup(text: string): string {
  return text
    // Cross-reference/link tags: {sx|word|...|...} → just "word"
    .replace(/\{(?:sx|a_link|d_link|i_link|dx_def|dx_ety)\|([^|}]+)\|?[^}]*\}/g, '$1')
    // Everything else (no content to preserve): remove entirely
    .replace(/\{[^}]+\}/g, '')
}

function extractText(value: unknown): string {
  if (typeof value === 'string') {
    return value === 'sense' || value === 'subsense' ? '' : stripMarkup(value);
  }
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(extractText)
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function extractDefinitionData(value: unknown): { definitions: definitionData[] } {
  const definitions: definitionData[] = [];

  function collectSense(value: unknown): definitionData {
    const definitionParts: string[] = [];
    const examples: string[] = [];

    function collectContent(currentValue: unknown) {
      if (Array.isArray(currentValue)) {
        if (currentValue[0] === 'vis') {
          const example = extractText(currentValue[1]);
          if (example) examples.push(example);
          return;
        }
        if (currentValue[0] === 'text') {
          const definition = extractText(currentValue[1]);
          if (definition) definitionParts.push(definition);
          return;
        }
        currentValue.forEach(collectContent);
        return;
      }
      if (currentValue && typeof currentValue === 'object') {
        const objectValue = currentValue as Record<string, unknown>;
        if ('dt' in objectValue) {
          collectContent(objectValue.dt);
          return;
        }
        if ('t' in objectValue) collectContent(objectValue.t);
      }
    }

    collectContent(value);
    return { definition: definitionParts.join(' '), examples };
  }

  function visit(currentValue: unknown) {
    if (Array.isArray(currentValue)) {
      if (currentValue[0] === 'sense' || currentValue[0] === 'subsense') {
        const sense = collectSense(currentValue[1]);
        if (sense.definition) definitions.push(sense);
        return;
      }
      currentValue.forEach(visit);
      return;
    }
    if (currentValue && typeof currentValue === 'object') {
      const objectValue = currentValue as Record<string, unknown>;
      if ('sseq' in objectValue) {
        visit(objectValue.sseq);
        return;
      }
      Object.values(objectValue).forEach(visit);
    }
  }

  visit(value);
  return { definitions };
}

export default function Index() {
  const { fontScale } = useFontSize();
  const [searchWord, setSearchWord] = useState(''); // State to hold the search word
  const [wordIndex, setWordIndex] = useState(0); // State to hold the index of the current definition
  const [currentDef, setCurrentDef] = useState<wordData[] | null>(null); // State to hold the current definition
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const shouldShowDefinitionCard = !!currentDef && currentDef.length > 0;

  async function getData() {
    const normalizedWord = searchWord.trim().toLowerCase();
    setSearchWord('');
    if (!normalizedWord) {
      setCurrentDef(null);
      return;
    }

    setIsLoading(true);
    const url = `https://dictionaryapi.com/api/v3/references/sd3/json/${encodeURIComponent(normalizedWord)}?key=${process.env.EXPO_PUBLIC_MW_API_KEY}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      const filteredResult = Array.isArray(result)
        ? result.filter((item: any) => {
            const headword = item?.meta?.id?.split(':')[0]?.trim().toLowerCase();
            return headword === normalizedWord;
          })
        : [];
      const allwords: wordData[] = filteredResult.flatMap((item: any) => ({
        ...extractDefinitionData(item.def ?? []),
        fl: item.fl,
        meta: {
          id: item.meta.id,
        },
      }));
      console.log(allwords[0]?.definitions ?? []);
      setCurrentDef(allwords);
      setWordIndex(0);
      setIsFavorite(false);
    } catch (error) {
      console.error(error);
      setCurrentDef(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFavorite() {
    if (!currentDef || currentDef.length === 0 || isFavorite) return;

    const word = currentDef[0];
    const wordText = word.meta.id.split(':')[0];
    saveFavoriteWord(wordText, currentDef);
    setIsFavorite(true);
  }

  
  function handleNextDefinition() { // Function to handle the next definition
    if (!currentDef) return; // If there is no current definition, return
    setWordIndex((prevIndex) => (prevIndex + 1) % currentDef.length); // Increment the index and wrap around if it exceeds the length of the definitions
  }

  function handlePreviousDefinition() { // Function to handle the previous definition
    if (!currentDef) return; // If there is no current definition, return
    setWordIndex((prevIndex) => (prevIndex - 1 + currentDef.length) % currentDef.length); // Decrement the index and wrap around if it goes below 0
  }

  return (
    <View style={styles.container}>
      <View style={styles.container2}>
        <TextInput
          style={[styles.inputField, { fontSize: 22 * fontScale }]}
          placeholder="Enter a word"
          placeholderTextColor="#6b7280"
          value={searchWord}
          onChangeText={setSearchWord}
          onSubmitEditing={getData}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={getData} disabled={isLoading}>
          <Text style={[styles.searchButtonText, { fontSize: 18 * fontScale }]}>{isLoading ? 'Loading...' : 'Submit'}</Text>
        </TouchableOpacity>
      </View>

      {shouldShowDefinitionCard && (
        <View style={styles.cardAndArrows}>
          <ScrollView
            style={styles.container3}
            contentContainerStyle={styles.container3Content}
          >
            <Text style={[styles.wordtext, { fontSize: 22 * fontScale }]}>{currentDef?.[wordIndex]?.meta?.id.split(':')[0] || ''}</Text>
            <Text style={[styles.wordtype, { fontSize: 16 * fontScale }]}>{currentDef?.[wordIndex]?.fl || ''}</Text>
            <TouchableOpacity
              accessibilityLabel={isFavorite ? 'Word saved to favorites' : 'Save word to favorites'}
              accessibilityRole="button"
              onPress={handleFavorite}
              disabled={!currentDef || isFavorite}
            >
              <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={28} color="#ffd33d" />
            </TouchableOpacity>
            {currentDef?.[wordIndex]?.definitions.map((definition, index) => (
              <View style={{ alignItems: 'center' }} key={index}>
                <Text style={[styles.wordtext, { fontSize: 22 * fontScale }]}>
                  {index + 1}. {definition.definition}
                </Text>
                {definition.examples.map((example, exampleIndex) => (
                  <Text style={[styles.exampletext, { fontSize: 18 * fontScale }]} key={exampleIndex}>
                    Example: {example}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.arrowRow}>
            <TouchableOpacity onPress={handlePreviousDefinition}>
              <Text style={styles.button2}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.counter, { fontSize: 20 * fontScale }]}>
              {currentDef ? `${wordIndex + 1} / ${currentDef.length}` : '0 / 0'}
            </Text>
            <TouchableOpacity onPress={handleNextDefinition}>
              <Text style={styles.button2}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  button2: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 42,
    color: '#fff',
    lineHeight: 42,
  },
  container2: {
    width: '100%',
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputField: {
    width: '82%',
    maxWidth: 520,
    minHeight: 58,
    backgroundColor: '#ffffff',
    color: '#111827',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 22,
    marginBottom: 12,
  },
  searchButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: '#4563d1',
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 8,
  },
  cardAndArrows: {
    width: '90%',
    maxWidth: 680,
    alignItems: 'center',
  },
  container3: {
    width: '100%',
    minHeight: 420,
    maxHeight: 520,
    backgroundColor: '#8e9aa8',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  container3Content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  wordtext: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 32,
    marginRight: 32,
    fontSize: 22,
    textAlign: 'center',
  },
  exampletext: {
    marginLeft: 42,
    marginRight: 32,
    fontSize: 18,
    fontStyle: 'italic',
    color: '#464242',
    textAlign: 'center',
  },
  wordtype: {
    fontStyle: 'italic',
    fontSize: 16,
    color: '#464242',
    marginBottom: 8,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    width: '100%',
  },
  counter: {
    fontSize: 20,
    color: '#ffffff',
    marginHorizontal: 12,
    marginTop: 4,
  },
});
