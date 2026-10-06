# Bingo

Web app mobile-first e futuro Telegram Mini App de Bingo de 75 pedras. Jogador recebe papel digital, marca números com canetas e desenha livremente; organizador sorteia e valida cartelas. Referências fornecidas pelo usuário em `docs/design-reference/` (não renderizar moldura de smartphone).

Stack: Next.js App Router, React 19, TypeScript strict, Tailwind 4, CSS variables; deploy alvo Vercel. Canvas nativo/Pointer Events, hooks e localStorage; sem banco nesta fase.

Rotas: `/` apresentação, `/play` jogador, `/admin` organizador, `/api/cards/signed`, `/api/cards/create`, `/api/cards/verify`, `/api/auth/telegram` fronteira de confiança. Domínio independente em `lib/bingo`, armazenamento em `lib/storage`, Telegram isolado em `lib/telegram`.

Cartelas 5×5, números em ordem de linhas, centro `null` (FREE). Colunas B 1–15, I 16–30, N 31–45, G 46–60, O 61–75. Vitória inicial por linha horizontal. Números reais e pedras são separados da arte. Não validar pela tinta.

Confiança criptográfica e tokens:
- `BNG1U.<payload>`: cartela unsigned criada no cliente para partidas locais; sempre exibida como "Cartela não verificada".
- `BNG1S.<payload>.<signature>`: cartela assinada exclusivamente pelo servidor via HMAC-SHA256 (`BINGO_SIGNING_SECRET`, ≥32 chars). Mensagem assinada vincula prefixo e payload canônico Base64URL. Números e ID de cartela gerados pela autoridade do servidor.
- Autenticação Telegram: verificação server-side estrita de HMAC do `initData` com `TELEGRAM_BOT_TOKEN`, verificação de freshness/replay via `auth_date` e extração de identidade segura. `initDataUnsafe` no client é apenas estético/UX transitório.
- Sem secrets configurados, o modo local BNG1U permanece funcional e a criação/verificação de BNG1S retorna erro controlado 503 sem segredo temporário silencioso.

Direção visual: madeira quente, papel creme, título manuscrito, números legíveis, marcas de tinta com variação orgânica determinística, estojo físico de sete canetas, botões táteis, diálogo modal integrado de confirmação em papel; safe areas e reduced motion.

Validação em 2026-10-06: lint, typecheck, 34 testes e build passando. Detalhes, contratos e próximos passos em `docs/HANDOFF.md`.
