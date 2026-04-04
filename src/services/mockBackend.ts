import type { CopyKind } from '../utils/copyKinds';

export type CopyVariant = 'base' | 'aggressive' | 'short' | 'long';

export async function generateCopy(input: {
  prompt: string;
  kind: CopyKind;
  variant?: CopyVariant;
}): Promise<{ text: string }> {
  await wait(900);
  const variant = input.variant ?? 'base';

  const header = headerForKind(input.kind, input.prompt);
  const body = bodyForVariant(variant, input.prompt);
  const cta = ctaForKind(input.kind);

  return { text: [header, body, cta].filter(Boolean).join('\n\n') };
}

export async function generateImage(input: { prompt: string }): Promise<{ imageUrl: string }> {
  await wait(650);
  const seed = Math.floor(Math.random() * 10_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    input.prompt
  )}?width=1024&height=1024&seed=${seed}`;
  return { imageUrl: url };
}

function headerForKind(kind: CopyKind, prompt: string): string {
  switch (kind) {
    case 'sales':
      return `Venda mais com uma oferta irresistível: ${prompt}`;
    case 'instagram':
      return `Ideia de post para Instagram: ${prompt}`;
    case 'ad':
      return `Anúncio pronto para rodar: ${prompt}`;
    case 'email':
      return `Email marketing de alta conversão: ${prompt}`;
  }
}

function bodyForVariant(variant: CopyVariant, prompt: string): string {
  if (variant === 'short') {
    return [
      `Você quer ${prompt}.`,
      `Aqui está o caminho mais rápido para chegar lá:`,
      `• 1 benefício direto`,
      `• 1 prova/garantia`,
      `• 1 chamada clara de ação`,
    ].join('\n');
  }

  if (variant === 'long') {
    return [
      `Se você sente que ${prompt} parece distante, é porque a maioria das soluções foca no “o que” e ignora o “como”.`,
      `A boa notícia: dá para simplificar — com a mensagem certa, na hora certa, para a pessoa certa.`,
      ``,
      `O que muda quando você aplica isso:`,
      `• Você prende a atenção nos primeiros 3 segundos`,
      `• Você conecta desejo + prova + urgência sem soar forçado`,
      `• Você deixa o próximo passo óbvio`,
      ``,
      `Comece com uma promessa específica, explique o mecanismo e finalize com uma oferta clara.`,
    ].join('\n');
  }

  if (variant === 'aggressive') {
    return [
      `Chega de promessas vazias. ${prompt} precisa acontecer agora.`,
      `Você não quer “tentar” — você quer resultado.`,
      `Aqui está a mensagem direta que corta a indecisão:`,
      `• Benefício forte`,
      `• Prova/autoridade`,
      `• Urgência real`,
    ].join('\n');
  }

  return [
    `Imagine conseguir ${prompt} sem perder tempo com tentativas aleatórias.`,
    `O segredo é comunicar valor de forma simples: benefício + prova + próximo passo.`,
    `Use esta estrutura e você verá mais cliques, mais respostas e mais vendas.`,
  ].join('\n');
}

function ctaForKind(kind: CopyKind): string {
  switch (kind) {
    case 'sales':
      return `CTA: Clique em “Quero aproveitar” e garanta sua condição especial agora.`;
    case 'instagram':
      return `CTA: Comente “EU QUERO” que eu te envio o passo a passo.`;
    case 'ad':
      return `CTA: Toque em “Saiba mais” e veja como começar hoje.`;
    case 'email':
      return `CTA: Responda este email com “QUERO” e eu te passo o próximo passo.`;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

