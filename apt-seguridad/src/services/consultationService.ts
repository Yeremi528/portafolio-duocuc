import api from './api';
import { AnalyzeRequest, SecurityAnalysis, ConsultaSummary } from '../types/consultation';

export async function uploadImage(imageUri: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as unknown as Blob);

  const { data } = await api.post<{ image_path: string }>(
    '/api/v1/consultations/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.image_path;
}

export async function analyzeImage(req: AnalyzeRequest): Promise<SecurityAnalysis> {
  const { data } = await api.post<SecurityAnalysis>('/api/v1/consultations/analyze', req);
  return data;
}

export async function listConsultations(): Promise<ConsultaSummary[]> {
  const { data } = await api.get<ConsultaSummary[]>('/api/v1/consultations');
  return data;
}
