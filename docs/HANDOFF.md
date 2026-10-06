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
  - Progressive haptics: feedback vibratório suave em marcação de células, sorteio de pedras, comemoração de BINGO e confirmação de cartela assinada.
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

Preparação real para **TELEGRAM MINI APP EM PRODUÇÃO**:
1. **Auditoria e Blindagem de Produção vs Desenvolvimento:**
   - Em produção (`NODE_ENV === "production"`), `POST /api/cards/signed` recusa categoricamente emissões sem `initData` (HTTP 401) e sem bot configurado (HTTP 503). Zero brechas ou fallbacks `dev-local` em produção.
   - O `uid` é obrigatoriamente extraído do payload criptograficamente validado do Telegram, ignorando qualquer `uid` arbitrário fornecido pelo cliente.
   - O mecanismo `dev-local` foi explicitamente isolado e só funciona quando `NODE_ENV !== "production"`.
2. **Auditoria Criptográfica do Telegram `initData`:**
   - Substituição de `localeCompare` por ordenação pura baseada em ASCII `(a < b ? -1 : a > b ? 1 : 0)`.
   - Teste de vetor com ordenação ASCII (`auth_date`, `chat_type`, `query_id`, `user`).
3. **Client Adapter e Lifecycle do Mini App:**
   - Centralização em `lib/telegram/client.ts` chamando com segurança `ready()` e `expand()`.
   - Progressive haptics para `impact`, `notification` e `selection`.
   - Nenhuma dependência obrigatória do objeto `window.Telegram` (funciona perfeitamente em browsers normais).
4. **Estados de Identidade e Troca Segura de Cartela:**
   - Mesa do jogador adota estados explícitos de identidade e só exibe o nome autenticado após validação no servidor.
   - Solicitação de cartela verificada que substitua marcações/desenhos existentes aciona o diálogo modal em papel/madeira.
5. **Endpoint de Diagnóstico Seguro (`GET /api/health`):**
   - Retorna `{ ok: true, status, signingConfigured, telegramConfigured }` com `Cache-Control: no-store` sem expor conteúdo de segredos.
6. **Guias Detalhados:**
   - Criação de `docs/TELEGRAM_SETUP.md` e `docs/DEPLOYMENT.md`.

## Em andamento

Nenhuma tarefa de implementação em aberto nesta etapa.

## Próximas 3 tarefas

1. Testar em aparelhos físicos Safari/iOS, Android e no WebView do Telegram com bot real registrado pelo mantenedor.
2. Banco de dados relacional / salas multiplayer persistentes para sincronização em tempo real entre organizador e jogadores.
3. Autorização do organizador, nonces únicos com persistência para prevenção total de replay e quotas de emissão por partida.

## Arquivos importantes

- `AGENTS.md` / `PROJECT_CONTEXT.md`: protocolo e visão permanente.
- `lib/telegram/*`: adapter client, ciclo de vida, haptics e validação criptográfica oficial de Mini Apps.
- `lib/bingo/token/*`: domínio modular de tokens (BNG1U, BNG1S, parser, HMAC).
- `app/api/cards/signed/route.ts`: rota autoritativa de cartelas BNG1S blindada para produção.
- `app/api/health/route.ts`: diagnóstico seguro de deploy.
- `app/api/auth/telegram/route.ts`: rota de validação de sessão Telegram.
- `app/api/cards/verify/route.ts`: rota de conferência e integridade.
- `components/bingo/PlayerScreen.tsx`: mesa do jogador com estados de identidade, haptics e confirmação modal.
- `components/admin/AdminScreen.tsx` e `DrawPanel.tsx`: mesa do organizador com haptics no sorteio.
- `docs/TELEGRAM_SETUP.md`: guia passo a passo do BotFather.
- `docs/DEPLOYMENT.md`: guia de deploy na Vercel e auditoria.
- `tests/production-telegram.test.ts`: suíte de testes de produção, segurança e Telegram.

## Decisões recentes

Ver ADR-011, ADR-012 e ADR-013. Isolamento absoluto de produção: BNG1S exige Telegram autenticado; `dev-local` é restrito a desenvolvimento. Ordenação determinística ASCII para initData. Diálogo modal integrado protege contra substituição involuntária de cartelas com marcas ou rabiscos.

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
- tests: 44/44 passaram (10 novos testes dedicados de produção e Telegram)
- build: passou com 12 rotas estáticas e dinâmicas compiladas com sucesso
- responsividade: zero overflow
- auditoria de produção: zero vulnerabilidades
