import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useEffect } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/authContext';
import { colors } from '../styles/Colors';
import { RootStackParamList } from '../types/navigation';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {

  const { signIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (user) navigation.replace('Main');
  }, [user]);

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      await signIn();
    } catch (error) {
      console.error('Error en vista login:', error);
      Alert.alert('Error', 'No se pudo iniciar sesión. Verifica tu conexión.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>APT Seguridad</Text>
      <Text style={styles.subtitle}>Inicia sesión</Text>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          activeOpacity={0.9}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#1e293b" />
          ) : (
            <>
              <View style={styles.googleIconPlaceholder}>
                <Image
                  source={require('../assets/images/logo-google.png')}
                  style={{ width: 24, height: 24, marginRight: 12 }}
                />
              </View>
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Al continuar, aceptas nuestros Términos y Política de Privacidad.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: colors.text,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIconPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  termsText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    opacity: 0.6,
  },
});
