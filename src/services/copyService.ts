import { api } from './api';
import { generateCopy, type CopyVariant } from './mockBackend';
import type { CopyKind } from '../utils/copyKinds';
import axios from 'axios';

export type GenerateCopyRequest = {
  prompt: string;
  kind: CopyKind;
  variant?: CopyVariant;
};

export type GenerateCopyResponse = {
  text: string;
};

export async function requestGenerateCopy(
  input: GenerateCopyRequest
): Promise<GenerateCopyResponse> {
  try {
    const res = await api.post<GenerateCopyResponse>('/generate', input);
    if (typeof res.data?.text === 'string') return res.data;
    throw new Error('Resposta inválida');
  } catch (err: unknown) {
    const backendMessage = extractBackendErrorMessage(err);
    if (backendMessage) {
      throw new Error(backendMessage);
    }
    if (process.env.EXPO_PUBLIC_DISABLE_MOCK === '1') {
      throw err instanceof Error ? err : new Error('Falha ao gerar');
    }
    return generateCopy(input);
  }
}

function extractBackendErrorMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null;
  const status = err.response?.status;
  if (status !== 502) return null;
  const data = err.response?.data;
  if (!data || typeof data !== 'object') return 'Backend indisponível (502)';
  const record = data as Record<string, unknown>;
  const raw = typeof record.error === 'string' ? record.error : null;
  if (!raw) return 'Falha no backend (502)';
  if (raw.toLowerCase().includes('model') && raw.toLowerCase().includes('not found')) {
    const model = extractMissingModel(raw);
    return [
      `Modelo do Ollama não encontrado${model ? ` (${model})` : ''}.`,
      `Rode: docker compose exec ollama ollama pull ${model ?? 'llama3.1'}`,
    ].join(' ');
  }
  return raw;
}

function extractMissingModel(message: string): string | null {
  const m = message.match(/model\s+'([^']+)'\s+not found/i);
  return m?.[1] ?? null;
}
