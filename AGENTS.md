# Protocolo de continuidade

If you are a new AI agent entering this repository: DO NOT begin coding immediately.
First read, in order:

1. `PROJECT_CONTEXT.md`
2. `docs/HANDOFF.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/TODO.md`

Then inspect `git status` and `git log --oneline -10`. Run relevant tests before major changes.
Never assume previous chat context exists. The repository documentation is the source of truth.

## Regras

- Não reescrever código funcional sem motivo; preservar decisões documentadas.
- Atualizar contexto, handoff e TODO em cada etapa importante e antes de encerrar a sessão.
- Registrar mudanças arquiteturais e incompatibilidades; nunca quebrar tokens existentes sem versionamento.
- Manter mobile-first (360–430px), acessibilidade e estética física: madeira, papel, tinta, canetas.
- Separar domínio, UI e arte. Marcas e rabiscos nunca comprovam Bingo.
- Secrets apenas server-side; nunca `NEXT_PUBLIC_BINGO_SECRET`. Não confiar em `initDataUnsafe`.
- Sem banco/multiplayer nesta fase; localStorage é local ao navegador, não autoridade compartilhada.
- Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` antes do handoff.
- Commits pequenos/coerentes, sem reescrever histórico. Registrar branch/commit/pendências no handoff.

Princípios: “O frontend faz tudo que puder; o servidor faz apenas aquilo em que precisamos confiar.”
“A segurança fica invisível. Para o jogador existem papel, tinta, canetinhas, rabiscos e Bingo.”

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
