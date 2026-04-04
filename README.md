# CopyBoost IA (Expo + TypeScript)

App mobile para gerar **copywriting** e **imagens** para marketing, com UI dark estilo SaaS, autenticação local, histórico e regra de negócio de **teste grátis por 1 mês** e depois **assinatura de R$ 99/mês** (simulada).

## Stack

- Expo + React Native + TypeScript
- React Navigation (Stack + Bottom Tabs)
- Zustand (estado global)
- AsyncStorage (persistência local)
- Axios (HTTP)
- Docker + Ollama (IA local para geração de texto)

## Funcionalidades

### Autenticação

- Login e Cadastro (e-mail e senha)
- Validação de formulário
- Persistência do usuário logado (AsyncStorage)
- Conta demo e auto-login (para facilitar testes)

Arquivos:
- [LoginScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/LoginScreen.tsx)
- [RegisterScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/RegisterScreen.tsx)
- [authStore.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/context/authStore.ts)

### Geração de Copy (IA)

- Tela “Criar copy” com prompt e seletor de formato:
  - Copy de vendas
  - Post para Instagram
  - Anúncio
  - Email marketing
- Geração de texto via `POST /generate`
- Diferenciais:
  - “Mais agressivo”
  - “Versão curta”
  - “Versão longa”
  - CTA automático

Fallback:
- Se o backend não estiver disponível, usa mock local (para não travar o app).

Arquivos:
- [HomeScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/HomeScreen.tsx)
- [ResultScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/ResultScreen.tsx)
- [copyService.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/services/copyService.ts)
- [mockBackend.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/services/mockBackend.ts)

### Geração de Imagem

- Geração via `POST /image`
- Tela de imagem com:
  - Preview
  - Regerar imagem
  - Baixar (salvar na galeria)
  - Compartilhar

Observação (Web/Preview):
- Para evitar bloqueio do navegador (ORB), a imagem é entregue via proxy do backend em `GET /image/proxy`.

Arquivos:
- [ImageScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/ImageScreen.tsx)
- [imageService.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/services/imageService.ts)

### Histórico

- Salva as copies geradas localmente
- Permite abrir qualquer item e reutilizar

Arquivos:
- [HistoryScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/HistoryScreen.tsx)
- [historyStore.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/context/historyStore.ts)

### Regra de negócio (Teste grátis + Assinatura)

- Teste grátis por **30 dias**
- Depois, bloqueia geração de copy/imagem e direciona ao paywall
- Assinatura **R$ 99/mês** (simulada por enquanto)

Arquivos:
- [billingStore.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/context/billingStore.ts)
- [SubscriptionScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/SubscriptionScreen.tsx)

### Voz (microfone no prompt)

- Botão de microfone no campo de prompt para ditar texto em `pt-BR`
- Usa `expo-speech-recognition`

Arquivos:
- [HomeScreen.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/screens/HomeScreen.tsx)
- [Input.tsx](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/components/Input.tsx)
- Config: [app.json](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/app.json)

## Estrutura de pastas

```
src/
  components/
  screens/
  services/
  hooks/
  context/
  navigation/
  utils/
backend/
```

## Como rodar

### 1) App (Expo)

Instalar dependências:

```bash
npm install
```

Rodar:

```bash
npx expo start
```

Para rodar no Web (preview):

```bash
npx expo start --web
```

### 2) Backend (Ollama + API)

#### Opção A) Docker (recomendado)

Subir Ollama + API:

```bash
docker compose up -d --build
```

Baixar o modelo (primeira vez):

```bash
docker compose exec ollama ollama pull llama3.1
```

API vai ficar em:
- http://localhost:3001

#### Opção B) Rodar API local (sem Docker)

```bash
cd backend
npm install
npm run build
npm start
```

## Configuração de URL do backend (app)

O Axios usa:
- `EXPO_PUBLIC_API_URL` (se definido)
- fallback:
  - **web:** `http://localhost:3001`
  - **mobile:** `http://SEU_BACKEND` (defina `EXPO_PUBLIC_API_URL` para seu IP/host)

Arquivo:
- [api.ts](file:///c:/Users/junio/Documents/Aplicativos/CopyBoostIA/src/services/api.ts)

## Testes/Checks

TypeScript (app):

```bash
npx tsc --noEmit
```

TypeScript (backend):

```bash
cd backend
npm run build
```

## Publicação (observação)

- A assinatura aqui é simulada (mock). Para publicação com cobrança real:
  - iOS: In-App Purchases (StoreKit)
  - Android: Google Play Billing

