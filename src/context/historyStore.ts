import { create } from 'zustand';
import { getJson, setJson } from '../services/storage';
import { createId } from '../utils/id';
import type { CopyKind } from '../utils/copyKinds';

export type HistoryItem = {
  id: string;
  createdAt: number;
  kind: CopyKind;
  prompt: string;
  text: string;
  imageUrl?: string;
};

type HistoryState = {
  ready: boolean;
  items: HistoryItem[];
  bootstrap: () => Promise<void>;
  createFromCopy: (input: {
    kind: CopyKind;
    prompt: string;
    text: string;
  }) => Promise<HistoryItem>;
  updateText: (id: string, text: string) => Promise<void>;
  setImageUrl: (id: string, imageUrl: string) => Promise<void>;
  clear: () => Promise<void>;
  getById: (id: string) => HistoryItem | null;
};

const STORAGE_HISTORY_KEY = 'history:items';

export const useHistoryStore = create<HistoryState>((set, get) => ({
  ready: false,
  items: [],

  bootstrap: async () => {
    const raw = await getJson(STORAGE_HISTORY_KEY);
    const items = parseHistoryItems(raw);
    set({ items, ready: true });
  },

  createFromCopy: async ({ kind, prompt, text }) => {
    const item: HistoryItem = {
      id: createId('copy'),
      createdAt: Date.now(),
      kind,
      prompt,
      text,
    };
    const next = [item, ...get().items].slice(0, 50);
    set({ items: next });
    await setJson(STORAGE_HISTORY_KEY, next);
    return item;
  },

  updateText: async (id, text) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, text } : it));
    set({ items: next });
    await setJson(STORAGE_HISTORY_KEY, next);
  },

  setImageUrl: async (id, imageUrl) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, imageUrl } : it));
    set({ items: next });
    await setJson(STORAGE_HISTORY_KEY, next);
  },

  clear: async () => {
    set({ items: [] });
    await setJson(STORAGE_HISTORY_KEY, []);
  },

  getById: (id) => {
    const found = get().items.find((it) => it.id === id);
    return found ?? null;
  },
}));

function parseHistoryItems(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  const parsed: HistoryItem[] = [];
  for (const item of value) {
    const it = parseHistoryItem(item);
    if (it) parsed.push(it);
  }
  return parsed;
}

function parseHistoryItem(value: unknown): HistoryItem | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') return null;
  if (typeof record.createdAt !== 'number') return null;
  if (typeof record.kind !== 'string') return null;
  if (typeof record.prompt !== 'string') return null;
  if (typeof record.text !== 'string') return null;

  const kind = parseCopyKind(record.kind);
  if (!kind) return null;

  const imageUrl = typeof record.imageUrl === 'string' ? record.imageUrl : undefined;

  return {
    id: record.id,
    createdAt: record.createdAt,
    kind,
    prompt: record.prompt,
    text: record.text,
    imageUrl,
  };
}

function parseCopyKind(value: string): CopyKind | null {
  if (value === 'sales') return 'sales';
  if (value === 'instagram') return 'instagram';
  if (value === 'ad') return 'ad';
  if (value === 'email') return 'email';
  return null;
}
