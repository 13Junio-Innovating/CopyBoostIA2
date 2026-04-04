import cors from 'cors';
import express, { type Request, type Response } from 'express';

type GenerateRequestBody = {
  prompt: string;
  kind: 'sales' | 'instagram' | 'ad' | 'email';
  variant?: 'base' | 'aggressive' | 'short' | 'long';
};

type GenerateResponseBody = {
  text: string;
};

type ImageRequestBody = {
  prompt: string;
};

type ImageResponseBody = {
  imageUrl: string;
};

type OllamaChatRequest = {
  model: string;
  stream: false;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  options?: {
    temperature?: number;
  };
};

type OllamaChatResponse = {
  message: { role: 'assistant'; content: string };
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/generate', async (req: Request, res: Response) => {
  const parsed = parseGenerateBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: 'Body inválido' });
    return;
  }

  try {
    const text = await generateWithOllama(parsed);
    const payload: GenerateResponseBody = { text };
    res.json(payload);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Falha ao gerar',
    });
  }
});

app.post('/image', (req: Request, res: Response) => {
  const parsed = parseImageBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: 'Body inválido' });
    return;
  }

  const seed = Math.floor(Math.random() * 10_000);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/image/proxy?prompt=${encodeURIComponent(parsed.prompt)}&seed=${seed}`;
  const payload: ImageResponseBody = { imageUrl };
  res.json(payload);
});

app.get('/image/proxy', async (req: Request, res: Response) => {
  const prompt = typeof req.query.prompt === 'string' ? req.query.prompt : null;
  const seedRaw = typeof req.query.seed === 'string' ? req.query.seed : null;
  const seed = seedRaw ? parseInt(seedRaw, 10) : null;
  const safeSeed = Number.isFinite(seed) ? Math.abs(seed as number) : hashString(prompt ?? '');

  if (!prompt || prompt.trim().length === 0) {
    res.status(400).send('Missing prompt');
    return;
  }

  try {
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}?width=1024&height=1024&seed=${safeSeed}`;

    const bytes = await fetchImageBytes(pollinationsUrl);
    res.setHeader('Content-Type', bytes.contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(bytes.buffer);
  } catch {
    try {
      const fallbackUrl = `https://picsum.photos/seed/${safeSeed}/1024/1024`;
      const bytes = await fetchImageBytes(fallbackUrl);
      res.setHeader('Content-Type', bytes.contentType);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(bytes.buffer);
    } catch {
      res.status(502).send('Failed to generate image');
    }
  }
});

const port = parsePort(process.env.PORT) ?? 3001;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});

async function generateWithOllama(input: GenerateRequestBody): Promise<string> {
  const url = process.env.OLLAMA_URL?.trim() || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL?.trim() || 'llama3.1';

  const system = buildSystemPrompt();
  const user = buildUserPrompt(input);

  const body: OllamaChatRequest = {
    model,
    stream: false,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    options: { temperature: 0.8 },
  };

  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${raw.slice(0, 200)}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = parseOllamaChatResponse(json);
  if (!parsed) throw new Error('Resposta inválida do Ollama');

  const content = parsed.message.content.trim();
  if (!content) throw new Error('Resposta vazia do Ollama');
  return content;
}

function buildSystemPrompt(): string {
  return [
    'Você é um especialista em copywriting brasileiro para marketing digital.',
    'Você escreve em pt-BR, com clareza, persuasão e sem promessas falsas.',
    'Use parágrafos curtos e bullets quando fizer sentido.',
    'Sempre finalize com um CTA direto e específico.',
    'Não use markdown com títulos; apenas texto pronto para colar.',
  ].join('\n');
}

function buildUserPrompt(input: GenerateRequestBody): string {
  const kindHint = kindToHint(input.kind);
  const variantHint = variantToHint(input.variant ?? 'base');
  return [
    `FORMATO: ${kindHint}`,
    `VARIAÇÃO: ${variantHint}`,
    `PROMPT: ${input.prompt}`,
    '',
    'Gere a copy completa.',
  ].join('\n');
}

function kindToHint(kind: GenerateRequestBody['kind']): string {
  switch (kind) {
    case 'sales':
      return 'Copy de vendas (oferta + benefícios + prova + urgência)';
    case 'instagram':
      return 'Post para Instagram (hook + valor + CTA para engajamento)';
    case 'ad':
      return 'Anúncio (headline + texto curto + CTA + 1-2 bullets)';
    case 'email':
      return 'Email marketing (assunto + pré-header + corpo + CTA)';
  }
}

function variantToHint(variant: NonNullable<GenerateRequestBody['variant']>): string {
  switch (variant) {
    case 'aggressive':
      return 'Mais agressivo (mais direto, mais urgente, ainda ético)';
    case 'short':
      return 'Versão curta (objetiva, sem enrolação)';
    case 'long':
      return 'Versão longa (história + mecanismo + detalhes + prova)';
    case 'base':
      return 'Padrão (equilíbrio entre persuasão e clareza)';
  }
}

function parseGenerateBody(value: unknown): GenerateRequestBody | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.prompt !== 'string') return null;
  if (typeof record.kind !== 'string') return null;
  if (!isCopyKind(record.kind)) return null;
  if (record.variant !== undefined && typeof record.variant !== 'string') return null;
  if (typeof record.variant === 'string' && !isVariant(record.variant)) return null;

  if (typeof record.variant === 'string') {
    return { prompt: record.prompt, kind: record.kind, variant: record.variant };
  }
  return { prompt: record.prompt, kind: record.kind };
}

function parseImageBody(value: unknown): ImageRequestBody | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.prompt !== 'string') return null;
  return { prompt: record.prompt };
}

function isCopyKind(value: string): value is GenerateRequestBody['kind'] {
  return value === 'sales' || value === 'instagram' || value === 'ad' || value === 'email';
}

function isVariant(value: string): value is NonNullable<GenerateRequestBody['variant']> {
  return value === 'base' || value === 'aggressive' || value === 'short' || value === 'long';
}

function parseOllamaChatResponse(value: unknown): OllamaChatResponse | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const msg = record.message;
  if (!msg || typeof msg !== 'object') return null;
  const msgRecord = msg as Record<string, unknown>;
  if (typeof msgRecord.role !== 'string') return null;
  if (msgRecord.role !== 'assistant') return null;
  if (typeof msgRecord.content !== 'string') return null;
  return { message: { role: 'assistant', content: msgRecord.content } };
}

function parsePort(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.floor(n);
}

async function fetchImageBytes(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'image/*',
    },
  });
  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Image HTTP ${response.status}: ${raw.slice(0, 120)}`);
  }
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? 'application/octet-stream';
  if (!contentType.startsWith('image/')) {
    const raw = await response.text();
    throw new Error(`Invalid content-type: ${contentType}. Body: ${raw.slice(0, 120)}`);
  }
  const ab = await response.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
