import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { URL_BASE } from '@/constants/URL';

WebBrowser.maybeCompleteAuthSession();

// Web client ID — used on all platforms to get an idToken the backend can verify.
// On native, GoogleSignin.configure(webClientId) requests an idToken signed for this client.
const WEB_CLIENT_ID = '149022845847-7ul7pgcobsh90oc5g4sd8tpnud4qhqhv.apps.googleusercontent.com';

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
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Web-only hook — must be declared unconditionally (Rules of Hooks)
  const [, webResponse, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    scopes:      ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    }
    restoreSession();
  }, []);

  // Process web OAuth response
  useEffect(() => {
    if (Platform.OS !== 'web' || !webResponse) return;

    if (webResponse.type === 'success') {
      const idToken =
        webResponse.params?.id_token ??
        webResponse.authentication?.idToken;
      if (idToken) {
        handleBackendLogin(idToken);
      } else {
        console.error('[Auth] Web: no idToken en respuesta', webResponse);
        setLoading(false);
      }
    } else if (webResponse.type === 'error') {
      console.error('[Auth] Web OAuth error:', webResponse.error);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [webResponse]);

  async function restoreSession() {
    try {
      const raw = await AsyncStorage.getItem('@user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.error('[Auth] Error restaurando sesión:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleBackendLogin(token: string) {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${URL_BASE}/oauth/google/login`,
        {},
        { headers: { Authorization: token } },
      );
      const userData: User = data.user ?? data;
      if (!userData?.id) throw new Error('Backend no devolvió datos de usuario');
      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[Auth] Backend error', error.response?.status, error.response?.data);
        alert(`Error ${error.response?.status ?? 'red'}: ${JSON.stringify(error.response?.data)}`);
      } else {
        console.error('[Auth] Error inesperado:', error);
        alert('Error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  }

  const signIn = async () => {
    setLoading(true);
    if (Platform.OS === 'web') {
      // Web: browser OAuth flow via expo-auth-session
      await promptAsync();
      // response handled in useEffect above
    } else {
      // Native Android/iOS: Play Services native flow — no browser redirect needed
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        if (!tokens.idToken) throw new Error('No se recibió idToken de Google');
        await handleBackendLogin(tokens.idToken);
      } catch (error: any) {
        setLoading(false);
        if (isErrorWithCode(error)) {
          switch (error.code) {
            case statusCodes.SIGN_IN_CANCELLED:
              break; // user cancelled, no alert needed
            case statusCodes.IN_PROGRESS:
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              alert('Google Play Services no está disponible o está desactualizado.');
              break;
            default:
              alert(`Error de Google Sign-In (código ${error.code}). Verifica la configuración.`);
          }
        } else {
          alert('Error inesperado al iniciar sesión con Google.');
        }
      }
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
      setUser(null);
      await AsyncStorage.removeItem('@user');
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('@user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUserData, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
