# Guia de Deploy — Vercel & Produção

Este documento especifica a infraestrutura de deploy do **Bingo de Mesa** na Vercel, o isolamento entre ambientes e os procedimentos de validação pós-deploy.

---

## 1. Visão Geral da Arquitetura de Deploy

- **Plataforma:** Vercel (Next.js App Router, Node.js runtime para Route Handlers).
- **Zero Infraestrutura de Banco/WebSockets:** Não requer PostgreSQL, Supabase, Redis ou servidores de socket nesta fase. O estado de jogo do navegador reside no `localStorage` do cliente e a autoridade criptográfica é sem estado (stateless) via HMAC-SHA256.
- **Segurança Server-Only:** Segredos nunca são embutidos no bundle client-side.
- **Cache HTTP:** Respostas de API possuem `Cache-Control: no-store` estrito.

---

## 2. Comandos de Build e Configuração na Vercel

Ao importar o repositório na Vercel:

- **Framework Preset:** `Next.js`
- **Root Directory:** `./`
- **Build Command:** `npm run build` (ou `next build`)
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Node.js Version:** `22.x` (conforme especificado em `package.json -> engines`)

---

## 3. Variáveis de Ambiente Necessárias

Configure em **Project Settings** → **Environment Variables**:

| Nome da Variável | Escopo | Obrigatória em Produção? | Descrição |
|---|---|---|---|
| `BINGO_SIGNING_SECRET` | Server-only | **SIM** | Chave secreta de alta entropia para assinatura HMAC-SHA256 (mínimo de 32 caracteres). |
| `TELEGRAM_BOT_TOKEN` | Server-only | **SIM** | Token fornecido pelo @BotFather (`<id>:<token>`) para validação de `initData` de Mini Apps. |

> [!CAUTION]
> NUNCA crie variáveis com o prefixo `NEXT_PUBLIC_` para nenhum segredo do jogo (ex: `NEXT_PUBLIC_BINGO_SECRET` ou `NEXT_PUBLIC_TELEGRAM_TOKEN`). Módulos de criptografia utilizam `import "server-only"`.

---

## 4. Diferenças Cruciais: Produção vs Desenvolvimento

| Aspecto | Desenvolvimento (`NODE_ENV !== "production"`) | Produção (`NODE_ENV === "production"`) |
|---|---|---|
| **Emissão de Cartela Assinada (`/api/cards/signed`)** | Permite emissão de teste com `uid: "dev-local"` quando `initData` não for fornecido. | **Exige estritamente** `initData` do Telegram autenticado. Sem `initData`, retorna `401 UNAUTHORIZED`. O fallback `dev-local` **não existe** em produção. |
| **Identidade de Jogador** | Em dev, o nome pode ser informado localmente ou assume "Visitante DEV". | O `uid` provém exclusivamente do usuário validado via Telegram. |
| **Tokens do Bot ausentes** | Se `TELEGRAM_BOT_TOKEN` não estiver configurado em dev, cartelas `dev-local` continuam operando se houver `BINGO_SIGNING_SECRET`. | Se `TELEGRAM_BOT_TOKEN` não estiver configurado, retorna `503 SERVICE_UNAVAILABLE`. |
| **Cartelas não verificadas (`BNG1U`)** | Funciona 100% no navegador offline/local. | Funciona 100% no navegador offline/local. |

---

## 5. Diagnóstico Seguro via Endpoint `/api/health`

Para validar a integridade da configuração sem vazar dados confidenciais:

Execute uma requisição GET para o endpoint de health check:
```bash
curl -i https://seu-dominio-na-vercel.app/api/health
```

### Cenário 1: Produção Pronta e Saudável (HTTP 200)
```json
{
  "ok": true,
  "status": "healthy",
  "signingConfigured": true,
  "telegramConfigured": true
}
```

### Cenário 2: Variáveis Ausentes ou Incompletas (HTTP 200)
```json
{
  "ok": true,
  "status": "degraded",
  "signingConfigured": false,
  "telegramConfigured": false
}
```

*O endpoint reporta apenas flags booleanas e nunca revela valores, comprimentos ou prefixos dos segredos.*

---

## 6. Como Testar as APIs Sem Revelar Secrets

### 1. Testar Validação de Cartela (`/api/cards/verify`)
Envie um token de teste para validação:
```bash
curl -X POST https://seu-dominio-na-vercel.app/api/cards/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "fake-token"}'
```
Resposta esperada (HTTP 400):
```json
{
  "ok": false,
  "valid": false,
  "verified": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Formato de token não reconhecido."
  }
}
```

### 2. Testar Proteção de Emissão sem Telegram (`/api/cards/signed`)
Tente solicitar uma cartela em produção sem `initData`:
```bash
curl -X POST https://seu-dominio-na-vercel.app/api/cards/signed \
  -H "Content-Type: application/json" \
  -d '{"name": "Jogador Sem Telegram"}'
```
Resposta esperada em produção (HTTP 401):
```json
{
  "ok": false,
  "valid": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Abra pelo Telegram para emitir cartela verificada."
  }
}
```

---

## 7. Checklist Pós-Deploy

- [ ] Acessar `/` (Página inicial) e confirmar carregamento do tema papel/madeira.
- [ ] Acessar `/play` no navegador convencional e verificar:
  - Marcação de números e desenho a caneta funcionam.
  - Gaveta de detalhes exibe `Cartela não verificada (BNG1U)`.
  - Mensagem informativa convida o usuário: *"Abra pelo Telegram para gerar uma cartela verificada."*
- [ ] Acessar `/api/health` e confirmar status `"healthy"`.
- [ ] Acessar `/admin` e confirmar funcionamento do sorteio de 75 pedras.
- [ ] Abrir pelo Telegram Mini App com bot oficial:
  - Header exibe `Jogando como [Nome]`.
  - Solicitação de cartela verificada emite token `BNG1S`.
  - Validador em `/admin` confirma com `✓ CARTELA VERIFICADA`.
