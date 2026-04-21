import api from './api';
import { RiskStats } from '../types/consultation';

export async function getRiskStats(commune: string): Promise<RiskStats> {
  const { data } = await api.get<RiskStats>(`/api/v1/risks/stats?commune=${encodeURIComponent(commune)}`);
  return data;
}
