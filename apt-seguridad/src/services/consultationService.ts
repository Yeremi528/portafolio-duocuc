import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { URL_BASE } from '../constants/URL';
import { AnalyzeRequest, SecurityAnalysis, ConsultaSummary } from '../types/consultation';

// Multipart upload usando fetch para que el boundary se genere correctamente.
// Axios sobrescribe el Content-Type sin boundary cuando se pasa manualmente,
// lo que causa que el backend falle con 400 en ParseMultipartForm.
export async function uploadImage(imageUri: string): Promise<string> {
  const raw = await AsyncStorage.getItem('@user');
  const user = raw ? JSON.parse(raw) : null;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // En web, imageUri es un blob: URL — necesitamos el Blob real
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('image', blob, 'photo.jpg');
  } else {
    // En native, React Native acepta este objeto como entrada de FormData
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as unknown as Blob);
  }

  const response = await fetch(`${URL_BASE}/api/v1/consultations/upload`, {
    method: 'POST',
    body: formData,
    // No seteamos Content-Type — fetch lo genera con el boundary correcto
    headers: {
      Authorization: `Bearer ${user?.token ?? 'local-token'}`,
      'X-RUT': user?.id ?? '00000000-0',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error ?? `Error ${response.status}`);
  }

  const data = await response.json();
  return data.image_path as string;
}

export async function analyzeImage(req: AnalyzeRequest): Promise<SecurityAnalysis> {
  const { data } = await api.post<SecurityAnalysis>('/api/v1/consultations/analyze', req);
  return data;
}

export async function listConsultations(): Promise<ConsultaSummary[]> {
  const { data } = await api.get<ConsultaSummary[]>('/api/v1/consultations');
  return data;
}
