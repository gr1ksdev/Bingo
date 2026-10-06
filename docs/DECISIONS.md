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

Só emitir após initData Telegram válido; servidor escolhe números, uid e cid. Sem sala persistida, usar `gid: local`, ignorando IDs de jogo do browser. Assinatura comprova origem/identidade; inscrição e autoridade das pedras requerem banco e autorização futuros. Sem UI de emissão nesta fase.

## ADR-008 — Fontes e orçamento de arte

Nunito/Kalam via Fontsource local (OFL), sem Google Fonts no runtime ou build. Strokes normalizados, coordenadas com quatro casas decimais e limites de 600 strokes, 3000 pontos por stroke, 30000 pontos totais. Falhas de armazenamento não derrubam a sessão e precisam ser visíveis.
