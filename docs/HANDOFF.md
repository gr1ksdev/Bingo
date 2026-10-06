# Handoff

## Estado atual

MVP local, polimento mobile e camada server-side confiável BNG1S + Autenticação Telegram Mini App concluídos e verificados em 2026-10-06. Next.js 16.3.8, React 19.3, TypeScript strict e Tailwind 4. Estética de madeira, papel e canetinhas preservada; sem banco de dados nem multiplayer nesta fase.

## O que já funciona

- `/`: landing page, navegação e cartela de demonstração.
- `/play`: cartela correta com estrela livre, estojo de sete canetas, marcas de tinta com variação orgânica determinística estável, DrawingCanvas sem resíduos em DPR fracionário e sem layout thrashing, borracha, desfazer, espessura, diálogo de confirmação visual em papel (sem `window.confirm`), persistência e emissão/solicitação de cartelas verificadas BNG1S conectada ao backend com detecção de Telegram Mini App.
- `/admin`: Web Crypto com rejection sampling, 75 pedras sem repetir, contador, recentes, histórico recolhido por padrão com `content-visibility: auto`, regra configurável, nova partida e estado final de 75/75 explicitamente concluído com banner e sem ação de sorteio residual.
- Validador de cartela (`/admin`):
  - `✓ CARTELA VERIFICADA`: exibição de `cid`, `gid`, `uid`/`name`, confirmação de assinatura HMAC-SHA256 e conferência das pedras.
  - `⚠ CARTELA NÃO VERIFICADA`: tratamento para BNG1U (origem não assinada), explicando que a combinação pode ser conferida mas a origem é local.
  - `✕ ASSINATURA INVÁLIDA`: detecção visual explícita com alerta em vermelho para cartelas adulteradas, rejeitando como confiável mesmo se os números formarem Bingo.
- Camada criptográfica de tokens (`lib/bingo/token/`):
  - `BNG1U`: cartelas unsigned locais codificadas em Base64URL canônico.
  - `BNG1S`: cartelas signed criadas pelo servidor com HMAC-SHA256 (`BINGO_SIGNING_SECRET`, ≥32 chars).
  - Comparação segura com `timingSafeEqual`.
  - Separação estrita: módulos de encode/decode/parse client-safe em `lib/bingo/token/` e módulo `signed.server.ts` isolado com `server-only`.
- Autenticação e Adaptação Telegram (`lib/telegram/`):
  - `client.ts`: detecção de ambiente Telegram, recuperação segura de `initData`, acionamento de haptics táteis.
  - `auth.server.ts`: validação criptográfica estrita do HMAC de `initData` com `TELEGRAM_BOT_TOKEN`, verificação de freshness/replay via `auth_date` (janela de 300s), extração segura do usuário autenticado.
- Route Handlers:
  - `POST /api/cards/signed`: emite cartelas BNG1S com números gerados exclusivamente pela autoridade do servidor.
  - `POST /api/cards/verify`: verifica tokens BNG1S e BNG1U retornando payload estruturado (`valid`, `kind`, `signatureValid`, `error`).
  - `POST /api/auth/telegram`: validação de sessão e retorno dos dados públicos do usuário Telegram.
  - Respostas com `Cache-Control: no-store` e limites reais de payload (12000 bytes).
- 34 testes automatizados cobrindo domínio, tokens, assinaturas, segurança, replay freshness e endpoints.

## Última tarefa concluída

Implementação da camada confiável server-side:
1. **Tokens BNG1S**: formato `BNG1S.<payloadBase64Url>.<signatureBase64Url>`, tipagem de `SignedCard` (`{ v: 1, cid, gid, nums, iat, uid?, name? }`), assinatura HMAC-SHA256 vinculando o prefixo, serialização canônica determinística sem padding.
2. **Modularização de tokens**: separação em `lib/bingo/token/` (`types.ts`, `base64url.ts`, `unsigned.ts`, `parser.ts`, `signed.server.ts`, `index.ts`), preservando retrocompatibilidade total com `lib/bingo/token.ts` e `lib/server/signing.ts`.
3. **Validação oficial Telegram Mini Apps**: especificação criptográfica oficial em `lib/telegram/auth.server.ts`, mitigação de replay capture baseada em `auth_date`, restrição de `initDataUnsafe` no client para apresentação visual apenas.
4. **Endpoints server-side**: criação de `POST /api/cards/signed`, `POST /api/cards/verify` e `POST /api/auth/telegram`, garantindo que o servidor seja a única autoridade para gerar números de cartelas assinadas.
5. **Validador Admin refinado**: distinção visual e semântica entre Cartela Verificada, Cartela Não Verificada e Assinatura Inválida.
6. **Ambiente sem segredos**: operação segura retornando HTTP 503 controlado sem gerar segredos temporários voláteis.

## Em andamento

Nenhuma tarefa em aberto nesta etapa.

## Próximas 3 tarefas

1. Testar em aparelhos físicos Safari/iOS, Android e no WebView do Telegram com bot real registrado.
2. Banco de dados relacional / salas multiplayer persistentes para sincronização em tempo real entre organizador e jogadores.
3. Autorização do organizador, nonces com persistência para prevenção total de replay e quotas de emissão por partida.

## Arquivos importantes

- `AGENTS.md` / `PROJECT_CONTEXT.md`: protocolo e visão permanente.
- `lib/bingo/token/*`: domínio modular de tokens (BNG1U, BNG1S, parser, HMAC).
- `lib/telegram/*`: adapter client e autenticação server-side de Mini Apps.
- `app/api/cards/signed/route.ts`: rota de emissão de cartelas signed autoritativa.
- `app/api/cards/verify/route.ts`: rota de verificação estruturada.
- `app/api/auth/telegram/route.ts`: rota de sessão Telegram.
- `components/admin/CardValidator.tsx`: validador com 3 estados táteis.
- `components/bingo/PlayerScreen.tsx`: mesa do jogador com emissão signed opcional.
- `.env.example`: documentação de variáveis de ambiente do servidor.
- `tests/bng1s-telegram.test.ts`: suíte de testes de tokens, HMAC e Telegram.

## Decisões recentes

Ver ADR-009 e ADR-010. Formato BNG1S com campos `uid` e `name` opcionais para permitir desenvolvimento local sem dependência forçada do Telegram. A autoridade de números reside exclusivamente no servidor. Validação oficial de initData com tolerância de clock skew (+30s) e expiração de 300s para mitigar replay capture sem banco de dados.

## Problemas conhecidos

- Sem banco de dados relacional ou multiplayer entre aparelhos; o jogo local reside no navegador.
- Replay mitigation do initData é restrito à janela de 300 segundos de `auth_date`; idempotência permanente requer tabela de nonces/sessões com banco.
- Histórico de partidas substitui o jogo local atual; arquivo de partidas é futuro.

## Variáveis de ambiente

- `BINGO_SIGNING_SECRET`: Chave HMAC-SHA256 (≥32 caracteres, alta entropia). Exclusivamente servidor.
- `TELEGRAM_BOT_TOKEN`: Token do bot Telegram do @BotFather. Exclusivamente servidor.
- Nunca expor via `NEXT_PUBLIC_`. Ausência de configuração desativa a emissão signed de forma segura (503).

## Como rodar

Node 22+, `npm ci`, `npm run dev`. Para produção local: `npm run build`, `npm start`.

## Como testar

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Último resultado

- lint: passou, zero warnings
- typecheck: passou, zero erros
- tests: 34/34 passaram
- build: passou com 11 rotas compiladas com sucesso
- responsividade: zero overflow
- auditoria de produção: zero vulnerabilidades
