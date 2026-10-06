# Guia de Configuração — Telegram Mini App (BotFather)

Este guia orienta o mantenedor a configurar o bot do Telegram oficial e conectar o Mini App em produção com segurança e integridade criptográfica.

---

## Princípios de Segurança

1. **Tokens são segredos estritamente server-side:** Nunca compartilhe ou faça commit do `TELEGRAM_BOT_TOKEN`.
2. **Sem segredos no frontend:** O token do bot nunca deve possuir prefixo `NEXT_PUBLIC_` ou ser enviado para o cliente.
3. **Ambiente HTTPS obrigatório:** O Telegram exige conexões seguras (HTTPS) com certificado válido para inicializar WebApps e transmitir `initData`.

---

## Passo a Passo no @BotFather

### 1. Criar ou Selecionar o Bot
1. Abra o Telegram e pesquise pelo bot oficial **[@BotFather](https://t.me/BotFather)** (verifique o selo de verificação azul).
2. Envie o comando `/newbot` (ou selecione um bot existente com `/mybots`).
3. Defina o nome amigável do bot (ex: `Bingo de Mesa`).
4. Defina o username do bot (deve terminar em `bot`, ex: `bingo_mesa_oficial_bot`).

### 2. Obter o `TELEGRAM_BOT_TOKEN`
1. O @BotFather responderá confirmando a criação e exibirá o token de acesso à API:
   ```text
   Use this token to access the HTTP API:
   123456789:ABCdefGhIJKlmNoPQRstuvwxYZ_EXAMPLE_ONLY
   ```
2. Guarde esse token em um gerenciador de senhas seguro.
3. **ATENÇÃO:** Nunca coloque esse valor em commits, documentações ou canais públicos.

### 3. Configurar o Mini App no BotFather

Existem duas formas complementares de configurar o Mini App no Telegram:

#### Opção A: Menu Button (Recomendado para acesso imediato)
O Menu Button fica visível no canto inferior esquerdo da conversa com o bot:
1. No @BotFather, envie `/mybots`.
2. Selecione o seu bot.
3. Clique em **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Envie a URL de produção da aplicação:
   ```text
   https://seu-dominio-na-vercel.app/play
   ```
5. Envie o texto do botão (ex: `Jogar Bingo`).

#### Opção B: Web App vinculado como Mini App Direto (`/newapp`)
Para criar um link direto do tipo `t.me/seu_bot/app`:
1. No @BotFather, envie `/newapp`.
2. Selecione o seu bot.
3. Defina um título (ex: `Bingo de Mesa`).
4. Forneça uma breve descrição.
5. Envie uma imagem de demonstração (640×360 px) se solicitado.
6. Envie a URL de produção:
   ```text
   https://seu-dominio-na-vercel.app/play
   ```
7. Escolha um short name (ex: `jogar`), resultando no link direto `t.me/seu_bot/jogar`.

---

## Configuração de Produção na Vercel

1. Acesse o painel da [Vercel](https://vercel.com) e selecione o projeto.
2. Vá em **Settings** → **Environment Variables**.
3. Adicione as seguintes variáveis de ambiente nos targets **Production** e **Preview**:

| Variável | Descrição | Exemplo de Valor |
|---|---|---|
| `BINGO_SIGNING_SECRET` | Chave de alta entropia para HMAC-SHA256 (≥32 caracteres) | `chave-secreta-aleatoria-de-pelo-menos-32-chars-gerada-com-openssl` |
| `TELEGRAM_BOT_TOKEN` | Token do bot fornecido pelo @BotFather | `123456789:ABCdefGhIJKlmNoPQRstuvwxYZ_TEST_BOT` |

> [!TIP]
> Gere uma chave forte para `BINGO_SIGNING_SECRET` via terminal:
> ```bash
> openssl rand -base64 36
> ```

4. Realize um novo Deploy (ou Redeploy) na Vercel para propagar as variáveis.

---

## Verificação e Diagnóstico Pós-Deploy

### 1. Diagnosticar configuração via Health Check
Abra no navegador a rota:
```text
https://seu-dominio-na-vercel.app/api/health
```
A resposta esperada deve ser:
```json
{
  "ok": true,
  "status": "healthy",
  "signingConfigured": true,
  "telegramConfigured": true
}
```
*Note que nenhum segredo é retornado, apenas o status booleano da configuração.*

### 2. Testar o Fluxo Completo no Telegram
1. Abra o seu bot no Telegram (Desktop, iOS ou Android).
2. Clique no **Menu Button** ("Jogar Bingo") ou no link do Mini App.
3. Observe a abertura do WebApp com a estética física de papel e madeira.
4. O topo exibirá: `Sua mesa de Bingo · Partida #... · Jogando como [Seu Nome]`.
5. Abra a gaveta **Sua cartela & código**:
   - Clique em **Solicitar cartela verificada (BNG1S)**.
   - O backend valida o `initData`, confere a assinatura HMAC e emite uma cartela assinada.
   - O selo verde `✓ Cartela verificada (BNG1S)` será exibido.
   - O feedback tátil (haptics) vibrará suavemente confirmando a emissão.
6. Copie o código da cartela (`BNG1S.<payload>.<assinatura>`).

### 3. Validar no Painel do Organizador (`/admin`)
1. No navegador do organizador (ou em outra aba), acesse:
   ```text
   https://seu-dominio-na-vercel.app/admin
   ```
2. Cole o código copiado no **Validador de cartela** e clique em **CONFERIR CARTELA**.
3. A interface deve confirmar:
   - `✓ CARTELA VERIFICADA`
   - Identidade Telegram e ID da cartela (`cid`)
   - Validade da assinatura HMAC-SHA256
   - Conferência das pedras sorteadas contra os números da cartela emitida.

---

## Resolução de Problemas (Troubleshooting)

- **Erro `401 UNAUTHORIZED` ao solicitar cartela assinada:**
  - Ocorre se a aplicação for aberta fora do Telegram ou se o `initData` estiver ausente/expirado (>5 minutos). Em produção, `dev-local` é terminantemente desabilitado.
- **Erro `503 SERVICE_UNAVAILABLE`:**
  - Ocorre se `BINGO_SIGNING_SECRET` ou `TELEGRAM_BOT_TOKEN` não estiverem preenchidos na Vercel. Verifique `/api/health`.
- **Tela em branco no Telegram:**
  - Verifique se a URL cadastrada no BotFather começa obrigatoriamente com `https://` e possui certificado SSL válido.
