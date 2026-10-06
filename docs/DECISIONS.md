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
