import { api } from './api';
import { generateCopy, type CopyVariant } from './mockBackend';
import type { CopyKind } from '../utils/copyKinds';

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
  } catch {
    return generateCopy(input);
  }
}

