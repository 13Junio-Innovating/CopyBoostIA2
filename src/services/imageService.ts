import { api } from './api';
import { generateImage } from './mockBackend';

export type GenerateImageRequest = {
  prompt: string;
};

export type GenerateImageResponse = {
  imageUrl: string;
};

export async function requestGenerateImage(
  input: GenerateImageRequest
): Promise<GenerateImageResponse> {
  try {
    const res = await api.post<GenerateImageResponse>('/image', input);
    if (typeof res.data?.imageUrl === 'string') return res.data;
    throw new Error('Resposta inválida');
  } catch {
    return generateImage(input);
  }
}

