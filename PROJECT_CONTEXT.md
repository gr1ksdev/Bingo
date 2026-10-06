# Bingo

Web app mobile-first e futuro Telegram Mini App de Bingo de 75 pedras. Jogador recebe papel digital, marca números com canetas e desenha livremente; organizador sorteia e valida cartelas. Referências fornecidas pelo usuário em `docs/design-reference/` (não renderizar moldura de smartphone).

Stack: Next.js App Router, React, TypeScript strict, Tailwind, CSS variables; deploy alvo Vercel. Canvas nativo/Pointer Events, hooks e localStorage; sem banco nesta fase.

Rotas: `/` apresentação, `/play` jogador, `/admin` organizador, `/api/cards/create` e `/api/cards/verify` fronteira de confiança. Domínio independente em `lib/bingo`, armazenamento em `lib/storage`, Telegram isolado em `lib/telegram`.

Cartelas 5×5, números em ordem de linhas, centro `null` (FREE). Colunas B 1–15, I 16–30, N 31–45, G 46–60, O 61–75. Vitória inicial por linha horizontal. Números reais e pedras são separados da arte. Não validar pela tinta.

`BNG1U.<payload>`: cartela livre, criada no cliente; sempre exibir não verificada. `BNG1S.<payload>.<signature>`: HMAC-SHA256 apenas no servidor com `BINGO_SIGNING_SECRET`; ausência de configuração nunca derruba o modo local. Identidade Telegram exige verificação server-side de initData; nunca confiar em initDataUnsafe. Sem segredo fallback.

Direção visual: madeira quente, papel creme, título manuscrito, números legíveis, marca irregular translúcida, sete canetas em estojo físico, botões táteis; respeitar safe areas e reduced motion. Assets procedurais locais, fontes com licença.

Estado inicial: implementação em andamento; detalhes e resultados reais em `docs/HANDOFF.md`.
