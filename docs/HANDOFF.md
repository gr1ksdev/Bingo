# Handoff

## Estado atual

A aplicação está em condições comprovadas de rodar como **TELEGRAM MINI APP REAL EM PRODUÇÃO**, preservando 100% de compatibilidade com navegadores normais, suporte local BNG1U offline e a estética de madeira, papel e canetinhas. Next.js 16.3.8, React 19.3, TypeScript strict e Tailwind 4. Sem banco de dados nem multiplayer nesta fase.

## O que já funciona

- `/`: landing page, navegação e cartela de demonstração.
- `/play`: mesa física do jogador:
  - Detecção transparente do ambiente (Telegram WebApp vs navegador convencional).
  - Estado explícito de identidade (`browser`, `telegram-unverified`, `telegram-verified`, `telegram-invalid`, `service-unavailable`).
  - No Telegram autenticado: exibe sutilmente no topo `Partida #... · Jogando como [Nome]`.
  - No navegador normal: botão/texto convida claramente o jogador: *"Abra pelo Telegram para gerar uma cartela verificada."* Em ambiente DEV (`NODE_ENV !== "production"`), mecanismo local explícito `[DEV] Solicitar cartela de teste (BNG1S)` permanece disponível e identificado.
  - Substituição segura de cartela: se houver marcações ou rabiscos a caneta, o diálogo modal tátil em papel/madeira exige confirmação antes de substituir a cartela por uma nova cartela verificada emitida pelo servidor.
  - Progressive haptics: feedback vibratório suave em marcação de células, sorteio de pedras, seleção/aplicação de carimbos e confirmação de cartela assinada.
  - DrawingCanvas com 60fps sem resíduos em DPR fracionário, borracha, desfazer e persistência local.
- `/admin`: mesa do organizador:
  - Sorteio com Web Crypto e rejection sampling (75 pedras sem repetição).
  - Contador, pedras recentes, histórico completo recolhido por padrão com `content-visibility: auto`.
  - Progressive haptics ao sortear cada pedra.
  - Estado final de 75/75 concluído com banner e sem ação de sorteio residual.
  - Validador tátil de cartela com 3 estados:
    - `✓ CARTELA VERIFICADA`: confere assinatura HMAC-SHA256, `cid`, `gid`, `uid`/`name` e checa as pedras sorteadas.
    - `⚠ CARTELA NÃO VERIFICADA`: confere a combinação de BNG1U avisando que a origem é local.
    - `✕ ASSINATURA INVÁLIDA`: detecção visual com alerta vermelho para cartelas adulteradas ou com chave inválida.
- Endpoints de Confiança e Diagnóstico:
  - `POST /api/cards/signed`: emite cartelas BNG1S com números gerados pela autoridade do servidor (`generateCard()`). Em produção, exige estritamente `initData` Telegram validado (ausência retorna 401; fallback `dev-local` é terminantemente proibido).
  - `POST /api/cards/create`: endpoint compatível de emissão via Telegram.
  - `POST /api/cards/verify`: verificação estruturada com timing-safe comparison.
  - `POST /api/auth/telegram`: autenticação oficial Telegram com verificação criptográfica e proteção contra replay capture (`auth_date`).
  - `GET /api/health`: diagnóstico seguro de deploy na Vercel reportando apenas flags booleanas (`signingConfigured`, `telegramConfigured`) com `Cache-Control: no-store` sem vazamento de segredos.
- Criptografia e Segurança do Telegram:
  - Ordenação determinística estrita por code points ASCII `(a < b ? -1 : a > b ? 1 : 0)` independente do locale do sistema operacional.
  - Derivação oficial de HMAC-SHA256 da chave `"WebAppData"` + `TELEGRAM_BOT_TOKEN`.
  - Rejeição de `initData` expirado (>300s) ou no futuro (>30s) e campos duplicados.
  - Limite de 12000 bytes e validação de Content-Type.
- Guias de Produção Completos:
  - `docs/TELEGRAM_SETUP.md`: passo a passo detalhado para o operador humano no @BotFather, Menu Button, URL HTTPS e testes.
  - `docs/DEPLOYMENT.md`: especificações para deploy na Vercel, variáveis server-only, diferenças dev/prod e checklist pós-deploy.
- 44 testes automatizados cobrindo domínio, tokens, assinaturas, segurança, replay freshness, endpoints, Telegram e adaptador client.

## Última tarefa concluída

Resolução do bug de produção no **TELEGRAM ANDROID WEBVIEW & CICLO DE VIDA ROBUSTO**:
1. **Identificação da Causa-Raiz em Produção:**
   - O `app/layout.tsx` não incluía o script oficial `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />`. Sem ele, WebViews do Telegram não injetam o objeto `window.Telegram.WebApp`, impedindo que `initData` fosse lido e fazendo com que `POST /api/auth/telegram` nunca fosse chamado.
   - Verificações no client abortavam imediatamente no primeiro tick síncrono antes que qualquer parâmetro ou bridge fosse processado.
2. **Injeção do SDK Oficial do Telegram:**
   - Adicionado no `<head>` do `RootLayout` via `next/script` com estratégia `beforeInteractive`.
3. **Cascata de Resolução (Waterfall Fallback) em `getInitData()`:**
   - Suporta múltiplos canais de extração de credenciais candidatas:
     1. `window.Telegram.WebApp.initData` (oficial);
     2. Parâmetro em hash de URL: `#tgWebAppData=...`;
     3. Parâmetro em search de URL: `?tgWebAppData=...`;
     4. `sessionStorage.getItem("initParams")`.
   - Compatibilidade robusta comprovada com clientes oficiais e forks Android (ex: `com.exteraless.app`), sem comprometer a segurança (credenciais continuam exigindo validação HMAC server-side).
4. **Ciclo de Vida do Cliente (`TelegramAuthState`):**
   - 6 estados explícitos: `BROWSER`, `TELEGRAM_INITIALIZING`, `TELEGRAM_UNAUTHENTICATED`, `TELEGRAM_AUTHENTICATING`, `TELEGRAM_AUTHENTICATED`, `TELEGRAM_AUTH_ERROR`.
   - Watcher limitado e assíncrono (10 verificações de 100ms = 1000ms max) para capturar injeção tardia do SDK ou parâmetros em WebViews.
5. **Autoridade Estrita de Nomes em BNG1S:**
   - O servidor deriva o nome autoritativo da identidade validada (`firstName + lastName` ou `firstName`).
   - `body.name` enviado pelo cliente é categoricamente ignorado na emissão assinada.
   - Na interface do jogador (`PlayerScreen`), cartelas verificadas BNG1S desabilitam a edição e exibem um selo estático de papel com a indicação `✓ Verificado`.
6. **Subtítulo Condicional no Cabeçalho:**
   - `Partida #... · Jogando como <displayName>` é renderizado estritamente quando `authState === "TELEGRAM_AUTHENTICATED"`.
7. **Suíte de Testes Expandida:**
   - 52 testes automatizados cobrindo disponibilidade imediata, inicialização tardia com hash, fallbacks de busca e storage, rejeição de headers isolados (`User-Agent`, `x-requested-with`), autoridade de nomes e compatibilidade BNG1U.

## Em andamento

Nenhuma tarefa de implementação em aberto nesta etapa.

## Próximas 3 tarefas

1. Testar em aparelhos físicos Safari/iOS, Android e no WebView do Telegram com bot real registrado pelo mantenedor.
2. Banco de dados relacional / salas multiplayer persistentes para sincronização em tempo real entre organizador e jogadores.
3. Autorização do organizador, nonces únicos com persistência para prevenção total de replay e quotas de emissão por partida.

## Arquivos importantes

- `AGENTS.md` / `PROJECT_CONTEXT.md`: protocolo e visão permanente.
- `app/layout.tsx`: carregamento do SDK oficial do Telegram Mini Apps (`strategy="beforeInteractive"`).
- `lib/telegram/*`: adapter client, ciclo de vida (`TelegramAuthState`), diagnóstico (`getDiagnosticInfo`), haptics e validação criptográfica oficial de Mini Apps.
- `lib/bingo/token/*`: domínio modular de tokens (BNG1U, BNG1S, parser, HMAC).
- `app/api/cards/signed/route.ts`: rota autoritativa de cartelas BNG1S blindada para produção.
- `app/api/cards/create/route.ts`: rota compatível com autoridade de nomes server-side.
- `app/api/auth/telegram/route.ts`: autenticação e resolução de `displayName`.
- `app/api/health/route.ts`: diagnóstico seguro de deploy.
- `components/bingo/PlayerScreen.tsx`: mesa do jogador com estados de autenticação, selo de nome verificado e confirmação modal.
- `docs/TELEGRAM_SETUP.md`: guia passo a passo do BotFather e arquitetura do cliente.
- `docs/DEPLOYMENT.md`: guia de deploy na Vercel e auditoria.
- `tests/production-telegram.test.ts`: suíte de testes de produção, segurança, cliente Telegram e autoridade BNG1S.

## Decisões recentes

Ver ADR-011, ADR-012, ADR-013 e ADR-014. Injeção do SDK oficial do Telegram no layout raiz; máquina de estados `TelegramAuthState` com watcher limitado; cascata de fallback para extração de credenciais candidatas; autoridade estrita de nomes no servidor para cartelas BNG1S com badge estático em papel.

## Problemas conhecidos

- Sem banco de dados relacional ou multiplayer entre aparelhos; o jogo local reside no navegador.
- Replay mitigation do initData é restrito à janela de 300 segundos de `auth_date`; idempotência permanente e nonces de uso único requerem tabela em banco.
- Histórico de partidas substitui o jogo local atual; arquivo de partidas é futuro.

## Variáveis de ambiente

- `BINGO_SIGNING_SECRET`: Chave HMAC-SHA256 (≥32 caracteres, alta entropia). Exclusivamente servidor.
- `TELEGRAM_BOT_TOKEN`: Token do bot Telegram do @BotFather. Exclusivamente servidor.
- Nunca expor via `NEXT_PUBLIC_`. Ausência de configuração desativa a emissão signed de forma segura (503). Diagnóstico disponível em `/api/health`.

## Como rodar

Node 22+, `npm ci`, `npm run dev`. Para produção local: `npm run build`, `npm start`.

## Como testar

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Último resultado

- lint: passou, zero warnings
- typecheck: passou, zero erros
- tests: 52/52 passaram (18 testes dedicados de produção, segurança e Telegram)
- build: passou com 12 rotas estáticas e dinâmicas compiladas com sucesso
- responsividade: zero overflow
- auditoria de produção: zero vulnerabilidades


## Etapa atual — estojo de carimbos (2026-10-07)

Carimbos são expressão cosmética exclusivamente client-side: nunca entram em BNG1S/BNG1U, assinatura, identidade ou regras. O botão BINGO local e suas mensagens foram removidos do /play. O botão BINGO retornará com claims server-side quando partidas persistentes forem implementadas, com gid real, sorteios oficiais e cartela vinculada à partida. Essa é a próxima fronteira arquitetural; nenhum banco ou multiplayer foi implementado nesta etapa.

Implementação: StampCase / StampGlyph / lib/stamps.ts; seis carimbos (coração, estrela, patinha, gatinho, flor, espiral), mais Livre. Cor independente. Estado inicial Marcar preserva toque tradicional. Borracha remove último stamp da célula tocada e continua apagando strokes. O canvas preserva capture, DPR e inversão da rotação. Estados antigos são normalizados sem descarte.

Referência principal inspecionada: docs/design-reference/Colagem Vintage de Bingo em Português.png, primeira composição. Arquivo do usuário já estava não rastreado ao iniciar; será preservado fora do commit.

Base: 09c17cd. Remote confirmado: git@github.com:gr1ksdev/Bingo.git. Branch e resultado final de QA/push serão registrados abaixo.
