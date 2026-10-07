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

## ADR-011 — Isolamento estrito entre Produção e Desenvolvimento (BNG1S)

Em produção (`NODE_ENV === "production"`), a emissão de cartelas BNG1S via `POST /api/cards/signed` exige estritamente um `initData` do Telegram válido e criptograficamente verificado. Sem `initData`, a requisição é rejeitada com HTTP 401. A ausência de `TELEGRAM_BOT_TOKEN` em produção retorna HTTP 503. O mecanismo `uid: "dev-local"` é terminantemente bloqueado em produção, existindo apenas em desenvolvimento quando `NODE_ENV !== "production"`.

## ADR-012 — Ordenação ASCII estrita e diagnóstico seguro (/api/health)

A ordenação de chaves do Telegram `initData` utiliza exclusivamente comparação de code points ASCII `(a < b ? -1 : a > b ? 1 : 0)`, eliminando dependência de `localeCompare` do sistema operacional.
O endpoint de diagnóstico `GET /api/health` retorna exclusivamente flags booleanas (`signingConfigured`, `telegramConfigured`) com cabeçalho `Cache-Control: no-store`, prevenindo vazamento de segredos em logs e inspeções.

## ADR-013 — Estados de identidade do cliente, diálogo modal e progressive haptics

O cliente adota estados explícitos de identidade (`browser`, `telegram-unverified`, `telegram-verified`, `telegram-invalid`, `service-unavailable`). A substituição de uma cartela BNG1U por BNG1S respeita o diálogo modal integrado em papel para prevenir perda acidental de marcações e desenhos. Haptic feedback utiliza progressive enhancement nas ações de marcação, conferência de pedras, BINGO e emissão de cartela assinada sem impacto em navegadores convencionais.

## ADR-014 — Injeção do SDK Telegram, ciclo de vida robusto, waterfall fallback e autoridade estrita de nomes

1. Injeção do SDK oficial via `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />` no `app/layout.tsx` para assegurar disponibilização do objeto global `window.Telegram`.
2. Máquina de estados explícita `TelegramAuthState` (`BROWSER`, `TELEGRAM_INITIALIZING`, `TELEGRAM_UNAUTHENTICATED`, `TELEGRAM_AUTHENTICATING`, `TELEGRAM_AUTHENTICATED`, `TELEGRAM_AUTH_ERROR`) com watcher limitado (10 ticks de 100ms = 1000ms max) para capturar inicialização assíncrona do WebApp.
3. Waterfall de extração de credenciais candidatas no cliente (`window.Telegram.WebApp.initData` → hash `#tgWebAppData=` → search `?tgWebAppData=` → `sessionStorage.initParams`), garantindo interoperabilidade com clientes oficiais e forks de WebViews (ex: `com.exteraless.app`). Cabeçalhos HTTP como `User-Agent` ou `x-requested-with` nunca conferem autenticação por si sós.
4. Derivação server-authoritative do nome em BNG1S (`firstName + lastName` se `lastName` existir, senão `firstName`), ignorando qualquer nome fornecido pelo cliente. Na interface (`PlayerScreen`), cartelas verificadas BNG1S desabilitam o campo editável e exibem um selo estático de leitura em papel com a indicação `✓ Verificado`.
5. Diagnóstico de ambiente client-side via `getDiagnosticInfo()` reportando métricas estruturadas com zero vazamento de hashes ou segredos.

## ADR-015 — Expressão visual local e verdade autoritativa da partida

Carimbos são expressão cosmética exclusivamente client-side: nunca entram em BNG1S/BNG1U, assinatura, identidade ou regras. O botão BINGO local e suas mensagens foram removidos do /play. O botão BINGO retornará com claims server-side quando partidas persistentes forem implementadas, com gid real, sorteios oficiais e cartela vinculada à partida. Essa é a próxima fronteira arquitetural; nenhum banco ou multiplayer foi implementado nesta etapa.

Preservar utilitários puros de validação e seus testes porque o organizador ainda os utiliza. Não sofisticar a conferência local do jogador. Cartela/identidade/partida/sorteios/claims pertencem à autoridade server-side; marks/strokes/stamps e escolhas de ferramenta/cor pertencem ao navegador.

Escolher SVG por célula para carimbos preserva o canvas existente, mantém números acima da tinta e permite remoção individual. Borracha toca uma célula para remover apenas seu carimbo mais recente; arrastar continua apagando rabiscos. Seleção direta no estojo dispensa modal e desacopla cor da ferramenta.

Extensão da ADR-015: `stampCaseOpen` persiste somente true/false, default true em storage antigo. Abrir/fechar muda apresentação, nunca ferramenta/cor/arte ou confiança. CSS controla transições de 300ms e reduced motion; SVG local representa fita, dentes, cursor e puxador, sem biblioteca ou raster do estojo.
