# Handoff

## Estado atual

MVP local e rodada de polimento/robustez mobile concluídos e verificados em 2026-10-06. Next.js 16.3.8, React 19.3, TypeScript strict e Tailwind 4. Referências visuais originais preservadas; sem deploy remoto.

## O que já funciona

- `/`: landing, navegação e cartela de demonstração.
- `/play`: cartela correta, estrela livre, sete canetas físicas, marcas de tinta com variação orgânica estável determinística, desenho por Pointer Events com matriz inversa otimizada e limpeza sem resíduos em DPR fracionário, borracha, desfazer, espessura, limpezas com confirmação tátil, troca de cartela com diálogo modal de papel/mesa (sem `window.confirm`), e persistência.
- `/admin`: Web Crypto, 75 pedras sem repetir, contador, recentes, histórico recolhido por padrão com `content-visibility: auto`, regra configurável, nova partida e estado final de 75/75 explicitamente concluído sem ação de sorteio residual.
- Validador de cartela: estado desabilitado evidente e affordance tátil destacada quando há token pronto para validação.
- PWA readiness: `manifest.webmanifest` (`app/manifest.ts`), `theme-color`, safe-areas completas em landscape/portrait, meta tags `apple-mobile-web-app` para modo standalone.
- Tokens unsigned copiáveis, reconstrução e validação contra pedras locais com aviso de não verificada.
- HMAC server-only, endpoints de criação/verificação, autenticação initData Telegram no servidor e desabilitação segura sem configuração.
- 24 testes automatizados de domínio/segurança/endpoints/variação orgânica e coordenadas.

## Última tarefa concluída

Rodada de polimento e robustez mobile:
1. **Artefato visual da faixa clara/bege em `/play` eliminado na causa raiz**:
   - Causa real identificada: conflito de GPU/compositing entre `background-attachment: fixed` no `body` com gradiente repetido a 2° de cor `#c6905230` (bege) vazando através de camadas aceleradas por hardware (`canvas` + `transform: rotate(-0.7deg)` da cartela).
   - Solução arquitetural: textura fixa de madeira movida para uma camada estática dedicada em `body::before` (`position: fixed; inset: 0; z-index: -1; pointer-events: none;`), eliminando `background-attachment: fixed` do `body`.
   - Adicionado `overflow: clip;` em `.card-surface` e `contain: paint;` em `.drawing-canvas`.
   - Elementos `<button>` de células de bingo mantidos estáveis no DOM com `disabled={!onMark}` ao alternar ferramentas, evitando desmontagem/remontagem de nós e reflow de grid.
2. **Robustez do DrawingCanvas**:
   - Matriz de rotação inversa calculada uma única vez no início do traço (`pointerdown`), eliminando layout thrashing recorrente durante o arraste em 60–120Hz.
   - Limpeza do backing-store do canvas com `ctx.setTransform(1, 0, 0, 1, 0, 0)` antes de `ctx.clearRect` para evitar resíduos em telas com `devicePixelRatio` fracionário.
   - Coordenadas estritamente normalizadas (0 a 1) preservando alinhamento perfeito da arte à cartela em 360, 375, 390, 412 e 430px, antes e após scroll da página.
3. **Marcas de tinta orgânicas determinísticas**:
   - Variação sutil em rotação (±14°), escala (0.89 a 0.96), offset X/Y (±1.5px), opacidade (0.51 a 0.57) e contorno irregular de gota (`border-radius`) e anel tracejado externo gerados por função pseudo-aleatória determinística baseada na semente `(index, number)`.
   - Total estabilidade após recarga de página (reload com persistência) sem alterar a estrutura de dados nem tokens.
   - Números pretos em z-index superior continuam com legibilidade perfeita.
4. **Administração (/admin)**:
   - Histórico mantido recolhido por padrão (`<details>` sem `open`) com memoização e `content-visibility: auto` para suportar 75 pedras instantaneamente.
   - Estado 75/75 concluído com selo visual definitório (`.draw-finished-banner`), sem botão de sorteio desabilitado residual.
5. **Validador de cartela**:
   - Estado disabled evidente (papel fosco, apagado, sem elevação 3D).
   - Estado ativo com token ganha destaque com relevo de carimbo verde vibrante e feedback tátil claro ao clique.
6. **Diálogo de confirmação integrado de papel e mesa**:
   - Substituição total de `window.confirm()` por um diálogo modal tátil estilizado de papel rasgado e madeira (`role="dialog"`, `aria-modal="true"`, fechamento por backdrop e tecla `Escape`).
   - Troca de cartela inteligente: direta se a cartela estiver limpa, com confirmação visual se houver marcas ou desenhos.
7. **PWA readiness**:
   - Criação de `app/manifest.ts` gerando `/manifest.webmanifest`.
   - Safe areas completas (`env(safe-area-inset-*)`) nos quatro lados da tela.
   - Suporte a standalone display e status bar translúcida para iOS e Android.

## Em andamento

Nenhuma tarefa em aberto nesta etapa.

## Próximas 3 tarefas

1. Testar em aparelhos físicos Safari/iOS e Android e no WebView do Telegram.
2. Configurar bot/SDK/HTTPS e ligar a UI de emissão signed ao endpoint autenticado.
3. Adicionar salas persistentes, autorização do organizador e claims antes de oferecer multiplayer.

## Arquivos importantes

- `AGENTS.md` / `PROJECT_CONTEXT.md`: protocolo e visão permanente.
- `lib/bingo/*`: domínio, tokens e regras.
- `lib/storage/*`: persistência versionada centralizada.
- `components/bingo/PlayerScreen.tsx` / `DrawingCanvas.tsx` / `BingoCell.tsx`: jogador, arte e canvas.
- `components/admin/*`: organizador, histórico e validador.
- `lib/server/*` / `app/api/cards/*`: HMAC/Telegram, somente servidor.
- `app/manifest.ts`: manifesto PWA standalone.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/QA.md`, `docs/ASSETS.md`.

## Decisões recentes

Ver ADR-006 a ADR-008. Textura de fundo isolada em camada fixa `body::before` para evitar bugs de composição GPU mobile com `background-attachment: fixed`. Variação de marcas derivada puramente de `(index, number)` para manter estabilidade determinística após reload sem migração de storage. Diálogo modal acessível substitui caixas de diálogo nativas do navegador.

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

## Como testar

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Último resultado

- lint: passou, zero warnings
- typecheck: passou
- tests: 24/24 passaram
- build: passou; `/`, `/play`, `/admin`, `/manifest.webmanifest`, ícone e rotas de API gerados
- responsividade: zero overflow nas rotas × 360/375/390/412/430px
- auditoria de produção: zero vulnerabilidades
