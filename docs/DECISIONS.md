# Decisões

## ADR-001 — Next.js e Vercel

App Router e TypeScript strict para UI e pequenos endpoints na mesma base. Manter projeto local compatível com Vercel, sem substituir a stack por hospedagem Sites.

## ADR-002 — Domínio e arte separados

Cartela row-major com centro null. A validação usa somente números e sorteio. Strokes normalizados, não Base64, para persistência e resize.

## ADR-003 — MVP local explícito

Persistência versionada no navegador, com sincronização entre abas; sem prometer multiplayer. Marcas locais e cartelas unsigned não representam confiança criptográfica.

## ADR-004 — Segurança por fronteira

HMAC-SHA256 com segredo server-only e verificação de initData no servidor antes de emitir cartela assinada. Recursos configuráveis desabilitados sem secrets. Nenhum segredo de fallback.

## ADR-005 — Arte procedural

Referências locais guiam a composição. Texturas CSS/SVG originais, sem copiar mockup externo nem depender de imagens remotas.

## ADR-006 — Contrato de token v1

Row-major, centro null, Base64URL canônico sem padding e UTF-8. CreatedAt unsigned em milissegundos; iat signed em segundos. HMAC assina `BNG1S.<payload>`, incluindo prefixo, com comparação constant-time. Tokens unsigned são sempre não verificados; parsing de signed não significa autenticidade.

## ADR-007 — Emissão assinada com escopo local

Servidor escolhe números, uid e cid. Sem sala persistida, usar `gid: local`, ignorando IDs de jogo do browser. Assinatura comprova origem/identidade; inscrição e autoridade das pedras requerem banco e autorização futuros.

## ADR-008 — Fontes e orçamento de arte

Nunito/Kalam via Fontsource local (OFL), sem Google Fonts no runtime ou build. Strokes normalizados, coordenadas com quatro casas decimais e limites de 600 strokes, 3000 pontos por stroke, 30000 pontos totais. Falhas de armazenamento não derrubam a sessão e precisam ser visíveis.

## ADR-009 — Modularização de tokens e campos de BNG1S

Separação em `lib/bingo/token/` (`types`, `base64url`, `unsigned`, `parser`, `signed.server`).
Estrutura de `SignedCard`: `{ v: 1, cid, gid, nums, iat, uid?, name? }`.
Campos `uid` e `name` tornados opcionais para viabilizar desenvolvimento local e testes sem Telegram obrigatório. O client nunca fornece `nums`; autoridade de números reside exclusivamente no servidor via `generateCard()`.

## ADR-010 — Validação Telegram Mini Apps e mitigação de replay

Protocolo oficial do Telegram implementado em `lib/telegram/auth.server.ts` com HMAC-SHA256 da string de checagem contra a chave derivada de `"WebAppData"` + `TELEGRAM_BOT_TOKEN`.
`initDataUnsafe` no client é restrito estritamente a conveniências visuais de apresentação (UX).
Mitigação de replay via `auth_date` com tolerância de 30s no futuro (clock skew) e expiração de 300s no passado. Nonces únicos e sessões persistentes com revogação serão adicionados na fase de banco de dados.
