import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL_BASE } from '../constants/URL';

const api = axios.create({ baseURL: URL_BASE });

api.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem('@user');
  if (raw) {
    const user = JSON.parse(raw);
    config.headers['Authorization'] = `Bearer ${user.token ?? 'local-token'}`;
    config.headers['X-RUT'] = user.id;
  }
  return config;
});

export default api;
