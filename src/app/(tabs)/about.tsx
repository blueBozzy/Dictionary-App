import { StyleSheet, Text, View } from 'react-native';
import { useFontSize } from '../_layout';

export default function AboutScreen() {
  const { fontScale } = useFontSize();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: 18 * fontScale }]}>About screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaf3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#12345b',
    fontWeight: '700',
  },
});
