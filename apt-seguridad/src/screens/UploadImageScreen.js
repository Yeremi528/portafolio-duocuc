import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../styles/Colors';

export default function UploadImageScreen() {

  const [image, setImage] = useState(null);

  {/* Tomar foto */}
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir el acceso a la cámara');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  {/* Abre galeria */}
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la galería');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  {/* Analizar imagen ia*/}
  const handleAnalyze = () => {
    if (!image) {
      Alert.alert('Error', 'Primero selecciona una imagen');
      return;
    }

    Alert.alert('Procesando', 'Enviando imagen a la IA...');
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Análisis de Seguridad</Text>

      {/* Preview */}
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.placeholder}>Sin imagen</Text>
        )}
      </View>

      {/* Botones */}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Elegir de galería</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Tomar foto</Text>
      </TouchableOpacity>

      {/* Analizar */}
      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
        <Text style={styles.buttonText}>Analizar imagen</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center'
  },

  imageContainer: {
    height: 250,
    backgroundColor: '#ddd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },

  placeholder: {
    color: '#666'
  },

  button: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center'
  },

  analyzeButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center'
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});