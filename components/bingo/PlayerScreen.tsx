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

type ConfirmAction =
  | "swap"
  | "clear-marks"
  | "clear-drawings"
  | "request-signed"
  | null;

type IdentityState =
  | "browser"
  | "telegram-unverified"
  | "telegram-verified"
  | "telegram-invalid"
  | "service-unavailable";

export function PlayerScreen() {
  const player = playerStore.useValue();
  const game = gameStore.useValue();
  const [mode, setMode] = useState<DrawingMode>("stamp");
  const [width, setWidth] = useState(5);
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [signedToken, setSignedToken] = useState<string | null>(null);
  const [signedLoading, setSignedLoading] = useState(false);
  const [signedNotice, setSignedNotice] = useState("");
  const [identityState, setIdentityState] = useState<IdentityState>("browser");
  const [verifiedUser, setVerifiedUser] = useState<{
    id: number;
    firstName: string;
  } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    telegram.init();
    if (!telegram.isTelegramEnvironment()) return;

    let active = true;
    const initData = telegram.getInitData();
    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setIdentityState("telegram-verified");
            setVerifiedUser(data.user);
            return;
          }
        }
        if (res.status === 503) {
          setIdentityState("service-unavailable");
        } else {
          setIdentityState("telegram-invalid");
        }
      })
      .catch(() => {
        // Fallback gracefully on network error
      });

    return () => {
      active = false;
    };
  }, []);

  const isTelegram = telegram.isTelegramEnvironment();
  const effectiveIdentity: IdentityState =
    identityState === "browser" && isTelegram
      ? "telegram-unverified"
      : identityState;

  useEffect(() => {
    if (message)
      resultRef.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [message]);

  useEffect(() => {
    if (!confirmAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmAction(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmAction]);

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
  const unsignedToken = encodeUnsigned(card);
  const activeToken = signedToken ?? unsignedToken;

  const hasMarks = Object.keys(marks).length > 0;
  const hasStrokes = strokes.length > 0;

  const handleRequestClearDrawings = () => {
    if (hasStrokes) {
      setConfirmAction("clear-drawings");
    }
  };

  const handleRequestClearMarks = () => {
    if (hasMarks) {
      setConfirmAction("clear-marks");
    }
  };

  const handleRequestSwap = () => {
    if (!hasMarks && !hasStrokes) {
      setSignedToken(null);
      setSignedNotice("");
      playerStore.update((p) => ({
        ...p,
        card: createUnsignedCard(p.card.name),
        marks: {},
        strokes: [],
      }));
      setMessage("");
    } else {
      setConfirmAction("swap");
    }
  };

  const handleRequestSignedClick = () => {
    if (hasMarks || hasStrokes) {
      setConfirmAction("request-signed");
    } else {
      executeRequestSignedCard();
    }
  };

  const executeRequestSignedCard = async () => {
    setSignedLoading(true);
    setSignedNotice("");
    try {
      const initData = telegram.getInitData();
      const response = await fetch("/api/cards/signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, name: card.name }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        if (response.status === 401) {
          throw new Error("Abra pelo Telegram para emitir cartela verificada.");
        }
        if (response.status === 503) {
          throw new Error(
            "Cartelas verificadas não estão disponíveis neste ambiente.",
          );
        }
        throw new Error(
          data.error?.message ||
            data.error ||
            "Não foi possível obter cartela assinada.",
        );
      }

      setSignedToken(data.token);
      setSignedNotice("✓ Cartela verificada emitida pelo servidor!");
      if (data.card?.nums) {
        playerStore.update((p) => ({
          ...p,
          card: {
            ...p.card,
            nums: data.card.nums,
            name: data.card.name || p.card.name,
          },
          marks: {},
          strokes: [],
        }));
      }
      if (typeof data.card?.uid === "number" && data.card?.name) {
        setVerifiedUser({ id: data.card.uid, firstName: data.card.name });
        setIdentityState("telegram-verified");
      }
      telegram.haptic.notification("success");
    } catch (err) {
      telegram.haptic.notification("warning");
      setSignedNotice(
        err instanceof Error
          ? err.message
          : "Erro ao solicitar cartela assinada.",
      );
    } finally {
      setSignedLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === "swap") {
      setSignedToken(null);
      setSignedNotice("");
      playerStore.update((p) => ({
        ...p,
        card: createUnsignedCard(p.card.name),
        marks: {},
        strokes: [],
      }));
      setMessage("");
    } else if (confirmAction === "clear-marks") {
      playerStore.update((p) => ({ ...p, marks: {} }));
    } else if (confirmAction === "clear-drawings") {
      playerStore.update((p) => ({ ...p, strokes: [] }));
    } else if (confirmAction === "request-signed") {
      executeRequestSignedCard();
    }
    setConfirmAction(null);
  };

  function callBingo() {
    const result = validateBingo(card.nums, drawn, pattern);
    setWon(result.won);
    if (result.won) {
      telegram.haptic.notification("success");
    } else {
      telegram.haptic.impact("light");
    }
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
        subtitle={
          verifiedUser
            ? `Partida #${game.value.id} · Jogando como ${verifiedUser.firstName}`
            : `Partida #${game.value.id}`
        }
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
            ? (i) => {
                telegram.haptic.impact("light");
                playerStore.update((p) => {
                  const nextMarks = { ...p.marks };
                  if (nextMarks[i]) delete nextMarks[i];
                  else nextMarks[i] = p.color;
                  return { ...p, marks: nextMarks };
                });
              }
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
        clear={handleRequestClearDrawings}
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
          disabled={!hasMarks}
          onClick={handleRequestClearMarks}
          aria-label="Limpar marcas de tinta"
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
          onClick={handleRequestSwap}
          aria-label="Trocar de cartela"
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

        {signedToken ? (
          <>
            <p className="verified-label">
              <Icon
                name="check"
                width={16}
                height={16}
                className="inline-icon"
              />{" "}
              Cartela verificada (BNG1S)
            </p>
            {verifiedUser && (
              <p className="help-text" style={{ fontWeight: 600 }}>
                Identidade Telegram confirmada: {verifiedUser.firstName}
              </p>
            )}
            <p className="help-text">
              Emitida e assinada pelo servidor com garantia de autenticidade
              (HMAC-SHA256).
            </p>
          </>
        ) : (
          <>
            <p className="trust-label">
              <Icon
                name="warning"
                width={16}
                height={16}
                className="inline-icon"
              />{" "}
              Cartela não verificada (BNG1U)
            </p>
            <p className="help-text">
              Criada neste navegador. O código permite conferir os números, mas
              não comprova a origem da cartela.
            </p>

            {effectiveIdentity === "browser" && !isDev ? (
              <p
                className="help-text"
                style={{ fontStyle: "italic", marginTop: "6px" }}
              >
                Abra pelo Telegram para gerar uma cartela verificada.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleRequestSignedClick}
                  disabled={signedLoading}
                  style={{ marginTop: "4px", marginBottom: "8px" }}
                >
                  <Icon name="stamp" />
                  {signedLoading
                    ? "Solicitando cartela…"
                    : effectiveIdentity === "browser" && isDev
                      ? "[DEV] Solicitar cartela de teste (BNG1S)"
                      : "Solicitar cartela verificada (BNG1S)"}
                </button>
                {effectiveIdentity === "browser" && isDev && (
                  <p
                    className="help-text"
                    style={{ fontSize: "0.75rem", opacity: 0.8 }}
                  >
                    Ambiente de desenvolvimento local ativo. Em produção,
                    cartelas BNG1S exigem autenticação do Telegram.
                  </p>
                )}
              </>
            )}

            {signedNotice && (
              <p
                role="status"
                className="help-text"
                style={{ fontStyle: "italic" }}
              >
                {signedNotice}
              </p>
            )}
          </>
        )}

        <label htmlFor="card-token">Código da cartela</label>
        <textarea id="card-token" readOnly value={activeToken} rows={3} />
        <button
          className="secondary-button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(activeToken);
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
      </details>
      <p className="footer-note">Feito de papel, tinta e bons momentos.</p>

      {confirmAction && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmAction(null);
          }}
        >
          <div
            className="paper dialog-paper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-desc"
          >
            <div className="dialog-header">
              <h3 id="dialog-title" className="paper-strip">
                {confirmAction === "swap" && "Trocar de cartela?"}
                {confirmAction === "clear-marks" && "Limpar marcações?"}
                {confirmAction === "clear-drawings" && "Apagar rabiscos?"}
                {confirmAction === "request-signed" &&
                  "Substituir por cartela verificada?"}
              </h3>
            </div>
            <p id="dialog-desc" className="dialog-message">
              {confirmAction === "swap" &&
                "Sua cartela atual, todas as manchas de tinta e seus rabiscos serão substituídos por uma nova cartela. Deseja continuar?"}
              {confirmAction === "clear-marks" &&
                "Todas as marcas de tinta serão apagadas. Os números da cartela e seus rabiscos a caneta serão preservados."}
              {confirmAction === "clear-drawings" &&
                "Todos os traços e desenhos serão removidos do papel. Os números e suas marcações de tinta continuarão intactos."}
              {confirmAction === "request-signed" &&
                "Sua cartela atual, todas as manchas de tinta e seus rabiscos serão substituídos pela nova cartela verificada emitida pelo servidor. Deseja continuar?"}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="dialog-button-cancel"
                onClick={() => setConfirmAction(null)}
              >
                {confirmAction === "swap" || confirmAction === "request-signed"
                  ? "Manter cartela"
                  : "Cancelar"}
              </button>
              <button
                type="button"
                className="dialog-button-confirm"
                onClick={handleConfirmAction}
              >
                {confirmAction === "swap" && "Sim, trocar"}
                {confirmAction === "clear-marks" && "Limpar marcas"}
                {confirmAction === "clear-drawings" && "Apagar rabiscos"}
                {confirmAction === "request-signed" && "Sim, substituir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
