import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/Colors.js';

export default function CustomButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%'
  },
  text: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16
  }
});