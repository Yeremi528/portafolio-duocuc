import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { colors } from '../styles/Colors';

export default function LoginScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    {/* Conexion backend aqui */}
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>APT Seguridad</Text>
      <Text style={styles.subtitle}>Inicia sesión</Text>

      <InputField
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
      />

      <InputField
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomButton title="Ingresar" onPress={handleLogin} />

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.text
  },
  link: {
    marginTop: 15,
    color: colors.secondary,
    textAlign: 'center'
  }
});