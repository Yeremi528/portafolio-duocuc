import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../styles/Colors';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Título */}
      <Text style={styles.title}>APT Seguridad</Text>
      <Text style={styles.subtitle}>Bienvenido</Text>

      {/* Botón principal */}
      <TouchableOpacity 
        style={styles.mainButton}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.mainButtonText}>Subir imagen</Text>
      </TouchableOpacity>

      {/* Botones secundarios */}
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardTitle}>Últimos análisis</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.cardTitle}>Perfil</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    color: colors.text
  },
  mainButton: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center'
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2
  },
  cardTitle: {
    fontSize: 16,
    color: colors.text
  }
});