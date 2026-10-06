# Verificação

Checks obrigatórios:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

22 testes cobrem geração (500 cartelas), ranges, unicidade, FREE, sorteio completo, regras, UTF-8/Base64URL, parsing, adulteração HMAC, configuração ausente, validade temporal de initData, limites de requests e emissão/verificação por Route Handlers. Secrets dos testes são fixtures fictícias, nunca fallback do app.

## Smoke de navegador opcional

Não é dependência do app e não integra `npm test`. Instale Playwright numa pasta de ferramentas separada e execute contra o build local **sem secrets configurados**:

```bash
npm install --prefix /tmp/bingo-qa playwright
node /tmp/bingo-qa/node_modules/playwright/cli.js install chromium
npm run build
npm start
```

Em outro terminal:

```bash
BINGO_PLAYWRIGHT_MODULE=/tmp/bingo-qa/node_modules/playwright/index.mjs \
  node scripts/browser-smoke.mjs
```

Variáveis opcionais: `BINGO_SMOKE_URL`, `BINGO_BROWSER_EXECUTABLE`, `BINGO_SMOKE_ARTIFACTS`. O browser requer as bibliotecas do sistema indicadas pelo Playwright; nenhum pacote de teste visual entra no bundle de produção.

O smoke usa contexto com toque e movimento reduzido. Exercita toque para canetas/células, strokes por eventos reais de toque via CDP, ferramentas por mouse, apagar/desfazer/limpar separadamente, persistência, cópia, duas abas, validação unsigned, histórico, 75 sorteios e Bingo. Aguardamos carregamento de fontes e mudanças de modo entre gestos. Teste físico de toque em iOS/Android e dentro do Telegram continua recomendado antes da publicação.

Verifica ausência de overflow em `/`, `/play`, `/admin` a 360, 375, 390, 412 e 430px. Capturas em 390px vão para `/tmp/bingo-smoke` por padrão. Falhas salvam `failure.png`; não são capturas de aprovação visual.

## Auditoria de dependências

`npm audit --omit=dev`: zero vulnerabilidades na verificação inicial.

`npm audit` completo: cinco avisos high na cadeia de desenvolvimento `eslint-config-next → fast-glob → micromatch → braces` (GHSA-vfj7-8cjw-p6xm). A versão upstream mais recente disponível de braces era 3.0.3, ainda afetada. A sugestão automática era regredir eslint-config-next para 14.2.35, incompatível com a fundação atual; não aplicada. Monitorar correção upstream. ESLint 9 é preservado por compatibilidade de peer dependencies do eslint-plugin-react, que ainda não aceita ESLint 10. Isso não remove nem silencia regras do lint.

## Resultado da primeira entrega — 2026-10-06

Lint (zero warnings), typecheck, 22 testes e build passaram. Smoke passou com toque, tinta, rabiscos, borracha, desfazer, limpezas separadas, persistência, clipboard, sincronização entre abas, token unsigned, histórico, 75 sorteios e chamada Bingo. Sem erros JavaScript de página.

As 15 combinações de rota/largura ficaram sem scroll horizontal. Capturas finais revisadas e preservadas em `docs/qa/landing-390.png`, `docs/qa/play-390.png`, `docs/qa/admin-390.png`. O cenário da captura terminou com 75 pedras; um navegador novo inicia com sorteio vazio. A conferência do token verifica conteúdo/estado estruturado, e a revisão de screenshots complementa as medições do browser. Movimento normal foi observado nas capturas iniciais; o smoke automatizado usa reduced motion. Testes em dispositivos reais continuam pendentes.
