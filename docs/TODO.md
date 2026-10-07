# TODO

- [x] Inspecionar repositório e referências
- [x] Criar documentação permanente
- [x] Fundação Next.js, Tailwind e design tokens
- [x] Domínio: cartela, sorteio, vitória e testes
- [x] Jogador e estojo de sete canetas
- [x] Canvas, borracha, desfazer e persistência
- [x] Admin, histórico e configurações locais
- [x] Token unsigned e validador
- [x] HMAC server-side e indisponibilidade segura sem secrets
- [x] Adapter Telegram e fronteira de autenticação
- [x] lint, typecheck, tests, build
- [x] Revisão responsiva e handoff final
- [x] Polimento e robustez mobile (faixa horizontal eliminada, marcas orgânicas determinísticas, modal tátil de confirmação, PWA readiness)
- [x] Cartelas assinadas BNG1S + Autenticação Telegram Mini App server-side (HMAC-SHA256, rotas `/api/cards/signed`, `/api/cards/verify`, `/api/auth/telegram`, validação oficial Telegram, proteção replay auth_date, validador admin com 3 estados táteis e 34 testes automatizados)
- [x] Preparação real de Telegram Mini App em produção (isolamento estrito prod vs dev, bloqueio de dev-local em produção, ordenação ASCII determinística, progressive haptics, health check `/api/health`, documentação BotFather e Vercel, 44 testes automatizados)
- [x] Correção de produção Telegram Mini App e ciclo de vida robusto (injeção do SDK oficial telegram-web-app.js no RootLayout, máquina de estados TelegramAuthState, waterfall fallback para hash/search/sessionStorage, blindagem de forks como exteraless, derivação server-authoritative de nome para BNG1S, selo tátil estático para cartelas verificadas e 52 testes automatizados)

## Próxima fase

- [ ] Testar em aparelhos físicos Safari/iOS, Android e WebView do Telegram com bot real registrado
- [ ] Banco de dados relacional / salas multiplayer persistentes
- [ ] Autorização do organizador e quotas de emissão por partida
- [ ] Claims remotos e registro de partidas arquivadas
- [ ] Padrões de vitória personalizados
- [ ] Áudio opt-in adicional
- [ ] Deploy na Vercel com secrets de produção
