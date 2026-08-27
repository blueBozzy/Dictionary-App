import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';

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
  const [searchWord, setSearchWord] = useState(''); // State to hold the search word
  const [wordIndex, setWordIndex] = useState(0); // State to hold the index of the current definition
  const [currentDef, setCurrentDef] = useState<wordData[] | null>(null); // State to hold the current definition
  async function getData() {  // Fetch data from the API 
    const normalizedWord = searchWord.trim().toLowerCase();
    if (!normalizedWord) return;

    const url = `https://dictionaryapi.com/api/v3/references/sd3/json/${encodeURIComponent(normalizedWord)}?key=d8d29e23-7b63-4d72-abd4-76ce9c2f4ec5`;
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
      console.log(allwords[0].definitions); // Log the fetched data to the console
      setCurrentDef(allwords); // Set the first definition as the current definition
      setWordIndex(0); // Reset the index to 0
    } catch (error) {
      console.error(error);
    }
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
        <TextInput style={styles.text}
          placeholder="Enter a word"
          value={searchWord}
          onChangeText={setSearchWord}
        />
        <TouchableOpacity onPress={getData}>
          <Text style={styles.text}>Fetch Data</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container3}
        contentContainerStyle={styles.container3Content}
      >
        <Text style={styles.wordtext}>{currentDef?.[wordIndex]?.meta?.id.split(':')[0] || ''}</Text>
        <Text style={styles.wordtype}>{currentDef?.[wordIndex]?.fl || ''}</Text>
        {currentDef?.[wordIndex]?.definitions.map((definition, index) => (
          <View style={{alignItems: 'center'}} key={index}>
            <Text style={styles.wordtext}>
              {index + 1}. {definition.definition}
            </Text>
            {definition.examples.map((example, exampleIndex) => (
              <Text style={styles.exampletext} key={exampleIndex}>
                Example: {example}
              </Text>
            ))}
          </View>
        ))}
        <View style={styles.arrowRow}>
          <TouchableOpacity onPress={handlePreviousDefinition}>
            <Text style={styles.button2}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentDef ? `${wordIndex + 1} / ${currentDef.length}` : '0 / 0'}
          </Text>
          <TouchableOpacity onPress={handleNextDefinition}>
            <Text style={styles.button2}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 40,
    color: '#fff',
  },
  container2: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container3: {
    flex: 1,
    width: '85%',
    maxWidth: 600,
    backgroundColor: '#8e9aa8',
    marginTop: 100,
    marginBottom: 100,
    borderRadius: 10,
  },
  container3Content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  wordtext: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 40,
    marginRight: 40,
    fontSize: 20,
  },
  exampletext: {
    marginLeft: 56,
    marginRight: 40,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#464242',
  },
  wordtype: {
  fontStyle: 'italic',
  fontSize: 14,
  color: '#464242',
},
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  counter: {
    fontSize: 20,
    color: '#000000',
    marginHorizontal: 8,
    marginTop: 5,
  },
});
