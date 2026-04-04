import { create } from 'zustand';
import { getJson, remove, setJson } from '../services/storage';
import { normalizeEmail } from '../utils/validation';
import { useBillingStore } from './billingStore';

export type AuthUser = {
  email: string;
};

type StoredCredentials = {
  email: string;
  password: string;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  bootstrap: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_USER_KEY = 'auth:user';
const STORAGE_CREDENTIALS_KEY = 'auth:credentials';

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  bootstrap: async () => {
    set({ status: 'loading' });
    const raw = await getJson(STORAGE_USER_KEY);
    const user = parseAuthUser(raw);
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    });
  },

  register: async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const credentials: StoredCredentials = { email: normalizedEmail, password };
    await setJson(STORAGE_CREDENTIALS_KEY, credentials);
    const user: AuthUser = { email: normalizedEmail };
    await setJson(STORAGE_USER_KEY, user);
    await useBillingStore.getState().ensureTrialStarted();
    set({ user, status: 'authenticated' });
  },

  login: async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const rawCreds = await getJson(STORAGE_CREDENTIALS_KEY);
    const creds = parseStoredCredentials(rawCreds);
    if (!creds || creds.email !== normalizedEmail || creds.password !== password) {
      throw new Error('E-mail ou senha inválidos');
    }
    const user: AuthUser = { email: normalizedEmail };
    await setJson(STORAGE_USER_KEY, user);
    await useBillingStore.getState().ensureTrialStarted();
    set({ user, status: 'authenticated' });
  },

  logout: async () => {
    await remove(STORAGE_USER_KEY);
    set({ user: null, status: 'unauthenticated' });
  },
}));

function parseAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.email !== 'string') return null;
  return { email: record.email };
}

function parseStoredCredentials(value: unknown): StoredCredentials | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.email !== 'string') return null;
  if (typeof record.password !== 'string') return null;
  return { email: record.email, password: record.password };
}
