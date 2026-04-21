// context/AuthContext.tsx
import { URL_BASE } from '@/constants/URL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Necesario para que el flujo web cierre correctamente la ventana de autenticación
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '149022845847-7ul7pgcobsh90oc5g4sd8tpnud4qhqhv.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '149022845847-sm8pmaj93go4poi7jh5m8mneu4kn9e57.apps.googleusercontent.com';





export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hook Web: Debe declararse en el nivel superior, sin importar la plataforma
  const redirectUri = makeRedirectUri({ scheme: 'itudy' });
  console.log('[Auth] redirectUri:', redirectUri);
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri: redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  useEffect(() => {
    // Configuración Nativa (Solo Android e iOS)
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID, // Siempre se usa el Web ID para obtener el idToken para el backend
      });
    }
    loadStorageData();
  }, []);

  const updateUserData = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Error guardando actualización de usuario", e);
    }
  };

  // Efecto para procesar la respuesta de la Web
  useEffect(() => {
    if (Platform.OS === 'web' && response?.type === 'success') {
      console.log("Respuesta Web de Google Auth:", response);
      const idToken = response.params.id_token || response.authentication?.idToken || response.authentication?.accessToken;
      
      if (idToken) {
        handleBackendLogin(idToken);
      } else {
        console.error("Error Web: No se recibió ningún token de Google");
      }
    } else if (Platform.OS === 'web' && response?.type === 'error') {
      console.error("Error en Auth Session Web:", response.error);
      alert("Error al iniciar sesión con Google en la web.");
    }
    
    // Si la promesa web terminó, apagamos el loader
    if (response) {
      setIsLoading(false);
    }
  }, [response]);

  async function loadStorageData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@user');
      if (jsonValue != null) setUser(JSON.parse(jsonValue));
    } catch (e) {
      console.error("Error cargando sesión", e);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleBackendLogin(token: string) {
    try {
      setIsLoading(true);
      console.log(`[Auth] Enviando token a: ${URL_BASE}/oauth/google/login`);

      const { data } = await axios.post(
        `${URL_BASE}/oauth/google/login`,
        {},
        { headers: { Authorization: token } }
      );

      const userData = data.user || data;
      if (!userData) throw new Error("No se recibieron datos del usuario");

      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[Auth] Status:', error.response?.status);
        console.error('[Auth] Body:', JSON.stringify(error.response?.data, null, 2));
        console.error('[Auth] Headers enviados:', error.config?.headers);
        alert(`Error ${error.response?.status ?? 'red'}: ${JSON.stringify(error.response?.data)}`);
      } else {
        console.error('[Auth] Error inesperado:', error);
        alert("Error inesperado. Revisa la consola.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        // FLUJO WEB
        await promptAsync();
        // El resto se maneja en el useEffect(..., [response])
      } else {
        // FLUJO NATIVO (Android / iOS)
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        
        const tokens = await GoogleSignin.getTokens();
        
        if (tokens.idToken) {
          console.log("Token nativo obtenido, enviando a backend...");
          await handleBackendLogin(tokens.idToken);
        } else {
          throw new Error("No se recibió el idToken nativo de Google.");
        }
      }
    } catch (error) {
      console.error("Error en signIn:", error);
      setIsLoading(false); // Detenemos el loader en caso de error
      
      if (Platform.OS !== 'web' && isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("El usuario canceló el inicio de sesión");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("El inicio de sesión ya está en progreso");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            alert("Los servicios de Google Play no están disponibles o están desactualizados.");
            break;
          default:
            alert("Error desconocido al iniciar sesión nativa con Google.");
        }
      }
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
      setUser(null);
      await AsyncStorage.removeItem('@user');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUserData, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
