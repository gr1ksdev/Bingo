"use client";
import { gameStore, newGame } from "@/lib/storage/game";
import { drawBall } from "@/lib/bingo/draw-ball";
import { PATTERN_LABELS } from "@/lib/bingo/constants";
import type { WinPattern } from "@/lib/bingo/types";
import { BingoHeader } from "@/components/bingo/BingoHeader";
import { RecentBalls } from "@/components/bingo/RecentBalls";
import { DrawPanel } from "./DrawPanel";
import { DrawHistory } from "./DrawHistory";
import { CardValidator } from "./CardValidator";
import { Icon } from "@/components/ui/Icon";
export function AdminScreen() {
  const game = gameStore.useValue();
  if (!game)
    return (
      <main className="app-shell">
        <p className="paper loading" role="status">
          Preparando a mesa do organizador…
        </p>
      </main>
    );
  const { drawn, pattern } = game.value;
  return (
    <main className="app-shell admin-shell">
      <BingoHeader
        title="Mesa do organizador"
        subtitle={`Partida #${game.value.id}`}
        admin
      />
      {game.warning && (
        <p className="notice" role="alert">
          {game.warning}
        </p>
      )}
      <DrawPanel
        drawn={drawn}
        onDraw={() =>
          gameStore.update((g) => {
            const next = drawBall(g.drawn);
            return next === null ? g : { ...g, drawn: [...g.drawn, next] };
          })
        }
      />
      <RecentBalls drawn={drawn} />
      <DrawHistory drawn={drawn} />
      <div className="section-divider" aria-hidden="true" />
      <CardValidator drawn={drawn} pattern={pattern} />
      <details className="paper settings">
        <summary>
          Configurações da mesa{" "}
          <span>
            <Icon
              name="arrow"
              width={14}
              height={14}
              style={{ transform: "rotate(90deg)" }}
            />
          </span>
        </summary>
        <label htmlFor="win-pattern">Combinação vencedora</label>
        <select
          id="win-pattern"
          value={pattern}
          onChange={(e) =>
            gameStore.update((g) => ({
              ...g,
              pattern: e.target.value as WinPattern,
            }))
          }
        >
          {Object.entries(PATTERN_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <p className="help-text">
          Vale linha horizontal por padrão. Alterações se aplicam à conferência
          local do jogador.
        </p>
        <button
          className="secondary-button"
          onClick={() => {
            if (
              window.confirm(
                "Começar outra partida? O histórico de pedras desta mesa será apagado. As cartelas dos jogadores serão mantidas.",
              )
            )
              gameStore.update(() => newGame());
          }}
        >
          Começar nova partida
        </button>
      </details>
      <aside className="local-info">
        <strong>Uma mesa, neste navegador.</strong>
        <p>
          Abra o jogador em outra aba para acompanhar as pedras. Outros
          dispositivos ainda não estão conectados. Esta área local não exige
          login.
        </p>
      </aside>
      <p className="footer-note">Quem organiza também faz parte da diversão.</p>
    </main>
  );
}
