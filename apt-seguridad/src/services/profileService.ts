import api from './api';
import { UserProfile } from '../types/consultation';

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/v1/profile');
  return data;
}
