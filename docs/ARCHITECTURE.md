# Arquitetura

Estrutura planejada:
```
app/                   páginas e Route Handlers
components/bingo/      papel, células, canetas, canvas e jogador
components/admin/      sorteio, histórico e validador
lib/bingo/             geração, sorteio, regras, parsing e tipos
lib/storage/           persistência versionada e hooks
lib/server/            assinatura HMAC e autenticação Telegram
lib/telegram/          adapter do SDK
docs/                  contexto de continuidade
```

Dados da cartela → regra + pedras sorteadas → resultado estruturado. Arte é estado separado: marcas por índice e strokes normalizados. Canvas reconstrói strokes em resize/DPR; borracha usa destination-out exclusivamente na arte.

Tokens Base64URL JSON UTF-8 têm schema estrito, limites e versão. Parsing não implica autenticidade. Somente servidor verifica HMAC; emissão requer identidade validada e configuração. Segredos nunca entram no grafo client.

localStorage pertence à origem/navegador. Sem estado em memória serverless e sem filesystem persistente. As Route Handlers são compatíveis com Vercel. Multiplayer e autoridade das pedras dependem de persistência futura.
