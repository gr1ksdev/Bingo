# Handoff

## Estado atual

MVP local concluído e verificado em 2026-10-06. Next.js 16.3.8, React 19.3, TypeScript strict e Tailwind 4. Referências originais preservadas; nenhum deploy remoto.

## O que já funciona

- `/`: landing, navegação e cartela de demonstração.
- `/play`: cartela correta, estrela livre, sete canetas físicas, marcas de tinta, desenho por Pointer Events, borracha, desfazer, espessura, limpezas separadas, nova cartela e persistência.
- `/admin`: Web Crypto, 75 pedras sem repetir, contador, recentes, histórico, regra configurável e nova partida.
- Tokens unsigned copiáveis, reconstrução e validação contra pedras locais com aviso de não verificada.
- HMAC server-only, endpoints de criação/verificação, autenticação initData Telegram no servidor e desabilitação segura sem configuração.
- 22 testes de domínio/segurança/endpoints; fontes locais e materiais CSS/SVG.

## Última tarefa concluída

MVP completo, revisão móvel, checks e smoke de navegador. Capturas revisadas em `docs/qa/`. Feedback após validar/Bingo é trazido à vista; ícones SVG evitam dependência de glyphs do sistema; rabiscos têm orçamento de armazenamento.

## Em andamento

Nenhuma tarefa de implementação em aberto nesta etapa. Próxima fase depende das prioridades abaixo.

## Próximas 3 tarefas

1. Testar em aparelhos Safari/iOS e Android e no WebView do Telegram.
2. Configurar bot/SDK/HTTPS e ligar a UI de emissão signed ao endpoint autenticado.
3. Adicionar salas persistentes, autorização do organizador e claims antes de oferecer multiplayer.

## Arquivos importantes

- `AGENTS.md` / `PROJECT_CONTEXT.md`: protocolo e visão permanente.
- `lib/bingo/*`: domínio, tokens e regras.
- `lib/storage/*`: persistência versionada centralizada.
- `components/bingo/PlayerScreen.tsx` / `DrawingCanvas.tsx`: jogador e arte.
- `components/admin/*`: organizador e conferência.
- `lib/server/*` / `app/api/cards/*`: HMAC/Telegram, somente servidor.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/QA.md`, `docs/ASSETS.md`.

## Decisões recentes

Ver ADR-006 a ADR-008. Tokens v1 row-major; prefixo faz parte da assinatura. Emissão signed usa escopo local e identidade Telegram confirmada. Rabiscos vetoriais têm limite global de pontos. A assinatura não representa inscrição em sala remota.

## Problemas conhecidos

- Sem multiplayer entre dispositivos, autorização de admin ou claims enviados. Um organizador local por vez; sem transações concorrentes entre abas.
- SDK/URL/bot do Telegram e UI de emissão ainda não conectados. Endpoints preparados, com teste usando fixtures; nenhum bot real configurado.
- Nova partida substitui histórico atual; arquivo de partidas anteriores é futuro.
- Avisos de dependências apenas de desenvolvimento documentados em `docs/QA.md`.
- Falhas de localStorage ficam visíveis; sessão em memória continua possível.

## Variáveis de ambiente

`BINGO_SIGNING_SECRET` (≥32 caracteres, alta entropia) e `TELEGRAM_BOT_TOKEN`. Opcionais e exclusivamente servidor. Ausentes na validação local. Nunca expor via NEXT_PUBLIC.

## Como rodar

Node 22+, `npm ci`, `npm run dev`. Abrir `/play` e `/admin` na mesma origem/navegador. Para produção local: `npm run build`, `npm start`.

Runtime neste ambiente: Node 22.23.3 instalado em `~/.local/share/node-v22.23.3`, comandos em `~/.local/bin`. Não faz parte do repositório.

## Como testar

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Smoke opcional e bibliotecas externas: `docs/QA.md`.

## Último resultado

- lint: passou, zero warnings
- typecheck: passou
- tests: 22/22 passaram
- build: passou; `/`, `/play`, `/admin`, ícone e dois endpoints gerados
- browser: smoke passou, incluindo canvas/borracha/desfazer/limpezas/recarga/cópia/abas/unsigned/75 sorteios/Bingo; sem erros de página
- responsividade: zero overflow nas três rotas × 360/375/390/412/430px
- auditoria de produção: zero vulnerabilidades; avisos dev conhecidos em `docs/QA.md`

## Observações para o próximo agente

Branch: `main`. Último commit de implementação: `202fec7` (UI/persistência); domínio/endpoints em `a584dab`; documentação inicial em `0b48c7c`. Este handoff e as capturas entram em um commit de documentação posterior; para o hash do commit atual, executar `git log -1 --oneline`.

Arquivos entregues: configuração, `app/`, `components/`, `lib/`, `public/`, `scripts/browser-smoke.mjs`, `tests/`, README e docs. Sem mudanças pendentes previstas após o commit deste handoff. Próxima tarefa: testes físicos e integração Telegram. O Git e esta documentação são a fonte de contexto, sem depender da conversa.

O ambiente de QA usou Playwright/Chromium e bibliotecas temporárias fora do repositório, com movimento reduzido e mistura de toque/mouse conforme `docs/QA.md`. Nenhuma dependência Rust foi adicionada: Turbopack/SWC são compiladores internos do Next.js. O preview temporário foi encerrado após a verificação; iniciar com `npm run dev`.
