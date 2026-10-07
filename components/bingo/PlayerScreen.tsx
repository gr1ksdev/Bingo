"use client";
import { useEffect, useState } from "react";
import { gameStore, playerStore } from "@/lib/storage/game";
import { createUnsignedCard } from "@/lib/bingo/generate-card";
import { encodeUnsigned } from "@/lib/bingo/token";
import { ballLabel, PATTERN_LABELS } from "@/lib/bingo/constants";
import {
  addStamp,
  createStamp,
  removeStamp,
  STAMP_TYPES,
  TOOL_LABELS,
  type StampType,
  setStampCaseOpen,
} from "@/lib/stamps";
import { telegram } from "@/lib/telegram/adapter";
import type { TelegramAuthState, TelegramUser } from "@/lib/telegram/types";
import { BingoHeader } from "./BingoHeader";
import { BingoCard } from "./BingoCard";
import { StampCase } from "./StampCase";
import { DrawingToolbar, type DrawingMode } from "./DrawingToolbar";
import { DrawingCanvas } from "./DrawingCanvas";
import { Icon } from "@/components/ui/Icon";
import { MAX_STROKES, MAX_DRAWING_POINTS } from "@/lib/drawing";

type ConfirmAction =
  "swap" | "clear-marks" | "clear-drawings" | "request-signed" | null;

export function PlayerScreen() {
  const player = playerStore.useValue();
  const game = gameStore.useValue();

  const [width, setWidth] = useState(5);
  const [message, setMessage] = useState("");

  const [copyStatus, setCopyStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [signedToken, setSignedToken] = useState<string | null>(null);
  const [signedLoading, setSignedLoading] = useState(false);
  const [signedNotice, setSignedNotice] = useState("");
  const [authState, setAuthState] = useState<TelegramAuthState>("BROWSER");
  const [verifiedUser, setVerifiedUser] = useState<TelegramUser | null>(null);

  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    let active = true;
    telegram.init();

    const candidateInitData = telegram.getInitData();
    if (candidateInitData) {
      const initTimer = setTimeout(() => {
        if (active) authenticate(candidateInitData);
      }, 0);
      return () => {
        active = false;
        clearTimeout(initTimer);
      };
    }

    if (telegram.isTelegramEnvironment()) {
      setTimeout(() => {
        if (active) setAuthState("TELEGRAM_INITIALIZING");
      }, 0);
    }

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(() => {
      if (!active) return;
      attempts += 1;
      telegram.init();

      const data = telegram.getInitData();
      if (data) {
        clearInterval(interval);
        authenticate(data);
        return;
      }

      if (telegram.isTelegramEnvironment()) {
        setAuthState((curr) =>
          curr === "BROWSER" ? "TELEGRAM_INITIALIZING" : curr,
        );
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (telegram.isTelegramEnvironment()) {
          setAuthState("TELEGRAM_UNAUTHENTICATED");
        } else {
          setAuthState("BROWSER");
        }
      }
    }, 100);

    async function authenticate(data: string) {
      setAuthState("TELEGRAM_AUTHENTICATING");
      try {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: data }),
          signal: AbortSignal.timeout(8000),
        });
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.authenticated && json.user) {
            setVerifiedUser(json.user);
            setAuthState("TELEGRAM_AUTHENTICATED");
            return;
          }
        }
        setAuthState("TELEGRAM_AUTH_ERROR");
      } catch {
        if (active) {
          setAuthState("TELEGRAM_AUTH_ERROR");
        }
      }
    }

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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

  const { card, color, marks, strokes, stamps, selectedTool } = player.value;
  const mode: DrawingMode =
    selectedTool === "freehand"
      ? "pen"
      : selectedTool === "eraser"
        ? "eraser"
        : "stamp";
  const setMode = (next: DrawingMode) =>
    playerStore.update((p) => ({
      ...p,
      selectedTool:
        next === "pen" ? "freehand" : next === "eraser" ? "eraser" : "mark",
    }));
  const { drawn, pattern } = game.value;
  const unsignedToken = encodeUnsigned(card);
  const activeToken = signedToken ?? unsignedToken;

  const hasMarks = Object.keys(marks).length > 0;
  const hasStrokes = strokes.length > 0 || stamps.length > 0;

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
        stamps: [],
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
          stamps: [],
        }));
      }
      if (typeof data.card?.uid === "number" && data.card?.name) {
        setVerifiedUser((prev) => ({
          id: data.card.uid,
          firstName: data.card.name,
          displayName: data.card.name,
          ...prev,
        }));
        setAuthState("TELEGRAM_AUTHENTICATED");
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
        stamps: [],
      }));
      setMessage("");
    } else if (confirmAction === "clear-marks") {
      playerStore.update((p) => ({ ...p, marks: {} }));
    } else if (confirmAction === "clear-drawings") {
      playerStore.update((p) => ({ ...p, strokes: [], stamps: [] }));
    } else if (confirmAction === "request-signed") {
      executeRequestSignedCard();
    }
    setConfirmAction(null);
  };

  return (
    <main className="app-shell player-shell">
      <BingoHeader
        title="Sua mesa de Bingo"
        subtitle={
          authState === "TELEGRAM_AUTHENTICATED" && verifiedUser
            ? `Partida #${game.value.id} · Jogando como ${verifiedUser.displayName || (verifiedUser.lastName ? `${verifiedUser.firstName} ${verifiedUser.lastName}` : verifiedUser.firstName)}`
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
        stamps={stamps}
        actionLabel={
          selectedTool === "mark"
            ? "marcar número"
            : `carimbar ${TOOL_LABELS[selectedTool]}`
        }
        onMark={
          mode === "stamp"
            ? (i) => {
                telegram.haptic.impact("light");
                playerStore.update((p) => {
                  if (STAMP_TYPES.includes(selectedTool as StampType))
                    return addStamp(
                      p,
                      createStamp(i, selectedTool as StampType, p.color),
                    );
                  if (i === 12) return p;
                  const nextMarks = { ...p.marks };
                  if (nextMarks[i]) delete nextMarks[i];
                  else nextMarks[i] = p.color;
                  return { ...p, marks: nextMarks };
                });
              }
            : undefined
        }
        caption={
          selectedTool === "mark"
            ? "Toque para marcar seus números."
            : selectedTool === "freehand"
              ? "Pode rabiscar. Essa cartela é sua!"
              : selectedTool === "eraser"
                ? "Apague tinta ou toque num carimbo."
                : `Carimbo ${TOOL_LABELS[selectedTool]} · toque na cartela.`
        }
      >
        <DrawingCanvas
          strokes={strokes}
          onEraseCell={(index) =>
            playerStore.update((p) => {
              const stamp = p.stamps
                .filter((s) => s.cellIndex === index)
                .at(-1);
              return stamp ? removeStamp(p, stamp.id) : p;
            })
          }
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

              return;
            }
            playerStore.update((p) => ({
              ...p,
              strokes: [...p.strokes, stroke],
            }));
          }}
        />
      </BingoCard>
      <StampCase
        open={player.value.stampCaseOpen}
        onOpenChange={(open) => {
          telegram.haptic.impact("light");
          playerStore.update((p) => setStampCaseOpen(p, open));
        }}
        selectedTool={selectedTool}
        selectedColor={color}
        onTool={(tool) => {
          telegram.haptic.impact("light");
          playerStore.update((p) => ({ ...p, selectedTool: tool }));
        }}
        onColor={(selected) => {
          telegram.haptic.selection();
          playerStore.update((p) => ({ ...p, color: selected }));
        }}
      />
      <DrawingToolbar
        mode={mode}
        setMode={setMode}
        width={width}
        setWidth={setWidth}
        undo={() =>
          playerStore.update((p) => ({ ...p, strokes: p.strokes.slice(0, -1) }))
        }
        marking={selectedTool === "mark"}
        canClear={hasStrokes}
        canUndo={strokes.length > 0}
        clear={handleRequestClearDrawings}
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
        <p className="notice" role="status">
          {message}
        </p>
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
        {signedToken ? (
          <div
            id="player-name"
            className="paper-badge-name"
            style={{
              padding: "8px 12px",
              background: "rgba(92, 58, 33, 0.08)",
              border: "1px dashed rgba(92, 58, 33, 0.4)",
              borderRadius: "6px",
              fontWeight: 700,
              color: "#3a2312",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span>{card.name}</span>
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#166534",
                fontWeight: 800,
              }}
            >
              ✓ Verificado
            </span>
          </div>
        ) : (
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
        )}

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
                Identidade Telegram confirmada:{" "}
                {verifiedUser.displayName ||
                  (verifiedUser.lastName
                    ? `${verifiedUser.firstName} ${verifiedUser.lastName}`
                    : verifiedUser.firstName)}
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

            {authState === "TELEGRAM_AUTHENTICATED" ? (
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
                  : "Solicitar cartela verificada (BNG1S)"}
              </button>
            ) : authState === "TELEGRAM_INITIALIZING" ||
              authState === "TELEGRAM_AUTHENTICATING" ? (
              <p
                className="help-text"
                style={{ fontStyle: "italic", marginTop: "6px" }}
              >
                Conectando ao Telegram…
              </p>
            ) : authState === "TELEGRAM_UNAUTHENTICATED" ? (
              <p
                className="help-text"
                style={{ fontStyle: "italic", marginTop: "6px" }}
              >
                Sessão Telegram sem dados de autenticação. Para emitir cartela
                verificada, abra este Mini App através de um botão ou menu
                oficial no Telegram.
              </p>
            ) : authState === "TELEGRAM_AUTH_ERROR" ? (
              <p
                className="help-text"
                style={{
                  fontStyle: "italic",
                  marginTop: "6px",
                  color: "#b91c1c",
                }}
              >
                Não foi possível autenticar sua sessão Telegram com o servidor.
              </p>
            ) : isDev ? (
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
                    : "[DEV] Solicitar cartela de teste (BNG1S)"}
                </button>
                <p
                  className="help-text"
                  style={{ fontSize: "0.75rem", opacity: 0.8 }}
                >
                  Ambiente de desenvolvimento local ativo. Em produção, cartelas
                  BNG1S exigem autenticação do Telegram.
                </p>
              </>
            ) : (
              <p
                className="help-text"
                style={{ fontStyle: "italic", marginTop: "6px" }}
              >
                Abra pelo Telegram para gerar uma cartela verificada.
              </p>
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
                "Sua cartela atual, todas as manchas de tinta e seus rabiscos e carimbos serão substituídos por uma nova cartela. Deseja continuar?"}
              {confirmAction === "clear-marks" &&
                "Todas as marcas de tinta serão apagadas. Os números da cartela e seus rabiscos a caneta serão preservados."}
              {confirmAction === "clear-drawings" &&
                "Todos os traços e carimbos serão removidos do papel. Os números e suas marcações de tinta continuarão intactos."}
              {confirmAction === "request-signed" &&
                "Sua cartela atual, todas as manchas de tinta e seus rabiscos e carimbos serão substituídos pela nova cartela verificada emitida pelo servidor. Deseja continuar?"}
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
