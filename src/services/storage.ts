import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getJson(key: string): Promise<unknown | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

