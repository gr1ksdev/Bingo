# Bingo

Web app mobile-first e Telegram Mini App de Bingo de 75 pedras. Jogador recebe papel digital, marca números com canetas e desenha livremente; organizador sorteia e valida cartelas. Referências fornecidas pelo usuário em `docs/design-reference/` (não renderizar moldura de smartphone).

Stack: Next.js App Router, React 19, TypeScript strict, Tailwind 4, CSS variables; deploy alvo Vercel. Canvas nativo/Pointer Events, hooks e localStorage; sem banco nesta fase.

Rotas: `/` apresentação, `/play` jogador, `/admin` organizador, `/api/cards/signed`, `/api/cards/create`, `/api/cards/verify`, `/api/auth/telegram`, `/api/health` diagnóstico de configuração. Domínio independente em `lib/bingo`, armazenamento em `lib/storage`, Telegram isolado em `lib/telegram`.

Cartelas 5×5, números em ordem de linhas, centro `null` (FREE). Colunas B 1–15, I 16–30, N 31–45, G 46–60, O 61–75. Vitória inicial por linha horizontal. Números reais e pedras são separados da arte. Não validar pela tinta.

Confiança criptográfica e tokens:
- `BNG1U.<payload>`: cartela unsigned criada no cliente para partidas locais; sempre exibida como "Cartela não verificada".
- `BNG1S.<payload>.<signature>`: cartela assinada exclusivamente pelo servidor via HMAC-SHA256 (`BINGO_SIGNING_SECRET`, ≥32 chars). Mensagem assinada vincula prefixo e payload canônico Base64URL. Números e ID de cartela gerados pela autoridade do servidor.
- Autenticação Telegram Mini App: verificação server-side estrita de HMAC do `initData` com `TELEGRAM_BOT_TOKEN`, ordenação ASCII lexicográfica determinística, verificação de freshness/replay via `auth_date` e extração de identidade segura. `initDataUnsafe` no client é apenas estético/UX transitório.
- Isolamento Produção vs Desenvolvimento: em produção, emissão BNG1S exige estritamente identidade Telegram validada (ausência ou erro retorna 401; fallback `dev-local` é terminantemente proibido). Em desenvolvimento local, mecanismo de teste `dev-local` é explicitamente identificado.
- Sem secrets configurados, o modo local BNG1U permanece funcional e a criação/verificação de BNG1S retorna erro controlado 503 sem segredo temporário silencioso. Diagnóstico seguro disponível via `GET /api/health` sem vazamento de segredos.

Direção visual: madeira quente, papel creme, título manuscrito, números legíveis, marcas de tinta com variação orgânica determinística, estojo físico de sete canetas, botões táteis, diálogo modal integrado de confirmação em papel; safe areas, reduced motion e progressive haptics.

Validação em 2026-10-07: lint, typecheck, 90 testes e build de produção passando. Detalhes, contratos e próximos passos em `docs/HANDOFF.md`.

## Carimbos locais — 2026-10-07

Carimbos são expressão cosmética exclusivamente client-side: nunca entram em BNG1S/BNG1U, assinatura, identidade ou regras. O botão BINGO local e suas mensagens foram removidos do /play. O botão BINGO retornará com claims server-side quando partidas persistentes forem implementadas, com gid real, sorteios oficiais e cartela vinculada à partida. Essa é a próxima fronteira arquitetural; nenhum banco ou multiplayer foi implementado nesta etapa.

QA da etapa: 67 testes, lint/typecheck/build e smoke Chromium de produção aprovados; 15 layouts sem overflow, Telegram simulado com/sem haptics. Commit de implementação c0ee619 enviado a origin/main. Captura em docs/qa/play-stamps-390.png. QA em aparelhos reais segue pendente.

StampCase agora representa fisicamente um estojo com zíper, possuindo estados open/closed persistidos (`stampCaseOpen`, default true). Coleção de 12 ferramentas: onze carimbos e Livre. Lona procedural local, costura, dentes de latão, cursor e puxador de couro móvel; cartela, canetas e auth preservadas.
QA da reconstrução: 90/90 testes, lint/typecheck/build e dois smokes de produção aprovados; cinco viewports exatas + desktop, aberto/fechado, sem overflow. Capturas play-stamp-case-{open,closed}-{390,desktop}.png em docs/qa.
