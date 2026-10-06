"use client";
import { useEffect, useRef, useState } from "react";
import { gameStore, playerStore } from "@/lib/storage/game";
import { createUnsignedCard } from "@/lib/bingo/generate-card";
import { encodeUnsigned } from "@/lib/bingo/token";
import { ballLabel, PATTERN_LABELS } from "@/lib/bingo/constants";
import { validateBingo } from "@/lib/bingo/validation";
import { telegram } from "@/lib/telegram/adapter";
import { BingoHeader } from "./BingoHeader";
import { BingoCard } from "./BingoCard";
import { MarkerCase } from "./MarkerCase";
import { DrawingToolbar, type DrawingMode } from "./DrawingToolbar";
import { DrawingCanvas } from "./DrawingCanvas";
import { Icon } from "@/components/ui/Icon";
import { MAX_STROKES, MAX_DRAWING_POINTS } from "@/lib/drawing";
export function PlayerScreen() {
  const player = playerStore.useValue();
  const game = gameStore.useValue();
  const [mode, setMode] = useState<DrawingMode>("stamp");
  const [width, setWidth] = useState(5);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    telegram.init();
  }, []);
  useEffect(() => {
    if (message)
      resultRef.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [message]);
  if (!player || !game)
    return (
      <main className="app-shell">
        <p className="paper loading" role="status">
          Preparando papel e canetinhas…
        </p>
      </main>
    );
  const { card, color, marks, strokes } = player.value;
  const { drawn, pattern } = game.value;
  const token = encodeUnsigned(card);
  const clearDrawings = () => {
    if (
      window.confirm(
        "Apagar todos os rabiscos? Os números e as marcações serão preservados.",
      )
    )
      playerStore.update((p) => ({ ...p, strokes: [] }));
  };
  function callBingo() {
    const result = validateBingo(card.nums, drawn, pattern);
    setWon(result.won);
    setMessage(
      result.won
        ? "Bingo! Sua combinação está completa. Que sorte bonita!"
        : `Quase lá! Faltam ${result.closest.missing.length} pedra${result.closest.missing.length === 1 ? "" : "s"} na sua combinação mais próxima: ${result.closest.missing.map(ballLabel).join(", ")}.`,
    );
  }
  return (
    <main className="app-shell player-shell">
      <BingoHeader
        title="Sua mesa de Bingo"
        subtitle={`Partida #${game.value.id}`}
      />
      <div className="last-ball-label paper-strip">
        <span>Última pedra:</span>
        <strong>
          {drawn.length ? ballLabel(drawn[drawn.length - 1]) : "Vamos começar?"}
        </strong>
        <span className="draw-count">{drawn.length}/75</span>
      </div>
      {(player.warning || game.warning) && (
        <p className="notice" role="alert">
          {player.warning || game.warning}
        </p>
      )}
      <BingoCard
        nums={card.nums}
        marks={marks}
        onMark={
          mode === "stamp"
            ? (i) =>
                playerStore.update((p) => {
                  const nextMarks = { ...p.marks };
                  if (nextMarks[i]) delete nextMarks[i];
                  else nextMarks[i] = p.color;
                  return { ...p, marks: nextMarks };
                })
            : undefined
        }
        caption={
          mode === "stamp"
            ? "Toque, marque e deixe a sorte chegar."
            : "Pode rabiscar. Essa cartela é sua!"
        }
      >
        <DrawingCanvas
          strokes={strokes}
          mode={mode}
          color={color}
          width={width}
          onStroke={(stroke) => {
            if (
              strokes.length >= MAX_STROKES ||
              strokes.reduce(
                (total, current) => total + current.points.length,
                stroke.points.length,
              ) > MAX_DRAWING_POINTS
            ) {
              setMessage(
                "O papel está cheio de arte! Desfaça ou limpe alguns rabiscos para continuar.",
              );
              setWon(false);
              return;
            }
            playerStore.update((p) => ({
              ...p,
              strokes: [...p.strokes, stroke],
            }));
          }}
        />
      </BingoCard>
      <DrawingToolbar
        mode={mode}
        setMode={setMode}
        width={width}
        setWidth={setWidth}
        undo={() =>
          playerStore.update((p) => ({ ...p, strokes: p.strokes.slice(0, -1) }))
        }
        canUndo={strokes.length > 0}
        clear={clearDrawings}
      />
      <MarkerCase
        color={color}
        onSelect={(selected) => {
          playerStore.update((p) => ({ ...p, color: selected }));
          if (mode === "eraser") setMode("pen");
        }}
      />
      <div className="play-actions">
        <button
          className="round-button action-small"
          disabled={!Object.keys(marks).length}
          onClick={() => {
            if (window.confirm("Limpar apenas as marcações de tinta?"))
              playerStore.update((p) => ({ ...p, marks: {} }));
          }}
        >
          <Icon name="trash" />
          <span>
            Limpar
            <br />
            marcas
          </span>
        </button>
        <button className="bingo-button" onClick={callBingo}>
          <Icon name="star" width={22} height={22} /> BINGO!{" "}
          <Icon name="star" width={22} height={22} />
        </button>
        <button
          className="round-button action-small"
          onClick={() => {
            if (
              window.confirm(
                "Trocar de cartela? A cartela atual e sua arte serão substituídas.",
              )
            ) {
              playerStore.update((p) => ({
                ...p,
                card: createUnsignedCard(p.card.name),
                marks: {},
                strokes: [],
              }));
              setMessage("");
            }
          }}
        >
          <Icon name="shuffle" />
          <span>
            Trocar
            <br />
            cartela
          </span>
        </button>
      </div>
      {message && (
        <div
          ref={resultRef}
          className={`result-note paper ${won ? "celebration" : ""}`}
          role="status"
        >
          <strong>
            {won ? (
              <>
                <Icon name="star" className="inline-icon" /> B I N G O{" "}
                <Icon name="star" className="inline-icon" />
              </>
            ) : (
              "De olho na próxima pedra"
            )}
          </strong>
          <p>{message}</p>
          <small>
            Conferência local · {PATTERN_LABELS[pattern].toLowerCase()}. Nenhum
            pedido foi enviado ao organizador.
          </small>
        </div>
      )}
      <div className="local-caption">
        <span className="status-dot" />
        Mesa local · vale {PATTERN_LABELS[pattern].toLowerCase()}
      </div>
      <details className="paper card-details">
        <summary>
          Sua cartela & código <span>↗</span>
        </summary>
        <label htmlFor="player-name">Nome na cartela</label>
        <input
          id="player-name"
          maxLength={60}
          key={card.createdAt}
          defaultValue={card.name}
          onBlur={(e) => {
            const name = e.target.value.trim() || "Visitante";
            e.target.value = name;
            playerStore.update((p) => ({ ...p, card: { ...p.card, name } }));
          }}
        />
        <p className="trust-label">
          <Icon name="warning" width={16} height={16} className="inline-icon" />{" "}
          Cartela não verificada
        </p>
        <p className="help-text">
          Criada neste navegador. O código permite conferir os números, mas não
          comprova a origem da cartela.
        </p>
        <label htmlFor="card-token">Código da cartela</label>
        <textarea id="card-token" readOnly value={token} rows={3} />
        <button
          className="secondary-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(token);
              setCopyStatus("Código copiado!");
            } catch {
              setCopyStatus("Selecione o código acima e copie manualmente.");
            }
          }}
        >
          <Icon name="copy" />
          Copiar código
        </button>
        <p role="status" className="help-text">
          {copyStatus}
        </p>
        <p className="help-text">
          Cartela verificada: integração Telegram em preparação.
        </p>
      </details>
      <p className="footer-note">Feito de papel, tinta e bons momentos.</p>
    </main>
  );
}
