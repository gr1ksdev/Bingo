# Bingo de mesa

Uma aplicação mobile-first de Bingo de 75 pedras com cartela de papel, marcas de tinta, sete canetinhas e rabiscos livres. Next.js App Router + React + TypeScript strict + Tailwind. Deploy alvo: Vercel.

## Rodar

Requer Node.js 22 ou superior e npm.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`: `/play` para jogar e `/admin` para organizar. Ambos compartilham o estado apenas na mesma origem e navegador. Abra em duas abas para acompanhar o sorteio. Não há multiplayer entre dispositivos.

## Usar

1. Escolha uma canetinha e toque nos números para marcar/desmarcar.
2. Use **Rabiscar** e desenhe sobre a cartela. A borracha, desfazer e lixeira desse modo afetam apenas rabiscos.
3. **Limpar marcas** remove os carimbos. Trocar cartela substitui a cartela e a arte após confirmação.
4. Em **Sua cartela & código**, personalize o nome e copie o token `BNG1U`.
5. No admin, sorteie pedras e cole o token no validador. Uma linha horizontal vence por padrão; outras regras estão em configurações.
6. **BINGO!** confere os números contra o sorteio local. As marcas e os rabiscos não interferem na validação.

O estado é salvo ao interagir e restaurado ao abrir. Falhas de armazenamento aparecem na tela. Desenhos são strokes com coordenadas normalizadas, limitados a 600 strokes, 3000 pontos por stroke e 30000 pontos totais; não são imagens Base64.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm start` serve o build de produção. Testes usam o runner nativo de Node e `tsx`; nenhum banco ou serviço externo é necessário.

## Configuração opcional

Copie `.env.example` para `.env.local` somente se precisar preparar a emissão assinada:

- `BINGO_SIGNING_SECRET`: segredo de alta entropia, no mínimo 32 caracteres, somente servidor.
- `TELEGRAM_BOT_TOKEN`: token do bot, somente servidor.

Sem essas variáveis, o MVP local funciona e os endpoints opcionais retornam indisponibilidade. Nunca use `NEXT_PUBLIC_` para secrets.

`POST /api/cards/create` recebe `{ "initData": "..." }`, verifica a identidade Telegram e emite `BNG1S` com números gerados no servidor. Ignora números/identidade/partida enviados pelo cliente; por enquanto o escopo assinado é `gid: "local"`. Não comprova inscrição em uma sala ou autoridade das pedras locais.

`POST /api/cards/verify` recebe `{ "token": "BNG1S..." }`, verifica HMAC-SHA256 e retorna o payload. Parsing no cliente nunca representa verificação de assinatura. O admin pode verificar tokens assinados; a UI de emissão Telegram será conectada em uma próxima etapa.

## Telegram e deploy

O adapter em `lib/telegram/adapter.ts` funciona sem o Telegram. O SDK ainda não é carregado pela aplicação: configurar bot/URL HTTPS e carregar o SDK oficial ao ativar o Mini App. `getInitData()` entrega apenas os dados que devem ser enviados ao servidor; não usar `initDataUnsafe` para confiança. O servidor rejeita initData adulterado ou com mais de cinco minutos.

Na Vercel: importe o repositório como projeto Next.js, mantenha o comando `npm run build`, configure variáveis opcionais no servidor e use Node 22+. O estado do MVP continua local ao navegador; não depende de filesystem persistente ou memória serverless. Nenhum deploy remoto foi realizado nesta etapa.

## Continuidade

Antes de alterar, leia `AGENTS.md`, `PROJECT_CONTEXT.md` e `docs/HANDOFF.md`. Arquitetura, decisões e próximos passos estão em `docs/`. Origem e licenças dos recursos visuais em `docs/ASSETS.md`.
