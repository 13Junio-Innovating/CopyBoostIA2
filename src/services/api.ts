import axios from 'axios';
import { Platform } from 'react-native';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (Platform.OS === 'web' ? 'http://localhost:3001' : 'http://SEU_BACKEND');

export const api = axios.create({
  baseURL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
