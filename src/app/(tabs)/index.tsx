import { Text, View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';

interface wordData {
  shortdef: string[];
  fl: string;
  meta: {
    id: string;
  };
}

export default function Index() {
  const [searchWord, setSearchWord] = useState(''); // State to hold the search word
  const [wordIndex, setWordIndex] = useState(0); // State to hold the index of the current definition
  const [currentDef, setCurrentDef] = useState<wordData[] | null>(null); // State to hold the current definition
  async function getData() {  // Fetch data from the API 
    const url = `https://dictionaryapi.com/api/v3/references/sd3/json/${searchWord}?key=d8d29e23-7b63-4d72-abd4-76ce9c2f4ec5`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const result = await response.json();
      const filteredResult = result.filter((item: any) => item.meta.id.split(':')[0] == searchWord); // Filter out items that doesnt have the header word matching the search word
      const allwords: wordData[] = filteredResult.flatMap((item: any) => ({
        shortdef: item.shortdef,
        fl: item.fl,
        meta: {
          id: item.meta.id,
        },
      }));
      console.log(filteredResult);
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
      <Link href="/about" style={styles.button}> {/* WILL BE A ROUTE TO THE WORDS DATABASE LATER */}
        Go to About About Screen
      </Link>
      <View style={styles.container3}>
        <Text style={styles.wordtext}>{currentDef?.[wordIndex]?.meta?.id.split(':')[0] || ''}</Text>
        <Text style={styles.wordtype}>{currentDef?.[wordIndex]?.fl || ''}</Text>
        {currentDef?.[wordIndex]?.shortdef?.map((def, index) => (
          <Text style={styles.wordtext} key={index}>
            {index + 1}. {def}
          </Text>
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
      </View>
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
    backgroundColor: '#8e9aa8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    marginBottom: 100,
  },
  wordtext: {
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginLeft: 40,
    marginRight: 40,
    fontSize: 20,
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
