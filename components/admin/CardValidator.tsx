"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { parseToken, type ParsedToken } from "@/lib/bingo/token";
import { validateBingo } from "@/lib/bingo/validation";
import { ballLabel, PATTERN_LABELS } from "@/lib/bingo/constants";
import type { WinPattern } from "@/lib/bingo/types";
import { BingoCard } from "@/components/bingo/BingoCard";
import { Icon } from "@/components/ui/Icon";
export function CardValidator({
  drawn,
  pattern,
}: {
  drawn: number[];
  pattern: WinPattern;
}) {
  const resultRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    card: ParsedToken;
    verified: boolean;
  } | null>(null);
  useEffect(() => {
    if (result)
      resultRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [result]);
  async function validate(event: FormEvent) {
    event.preventDefault();
    setResult(null);
    setError("");
    setBusy(true);
    try {
      const card = parseToken(token);
      if (card.kind === "signed") {
        const response = await fetch("/api/cards/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: AbortSignal.timeout(10000),
        });
        const body: { verified?: boolean; error?: string } =
          await response.json();
        if (!response.ok || body.verified !== true)
          throw new Error(
            body.error || "Não foi possível verificar a assinatura.",
          );
      }
      setResult({ card, verified: card.kind === "signed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }
  const combination = result
    ? validateBingo(result.card.payload.nums, drawn, pattern)
    : null;
  return (
    <section className="validator-section">
      <h2 className="paper-strip">Validador de cartela</h2>
      <form className="paper validator-form" onSubmit={validate}>
        <label htmlFor="validate-token">Código da cartela</label>
        <textarea
          id="validate-token"
          placeholder="Cole o código da cartela aqui…"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setResult(null);
            setError("");
          }}
          maxLength={4600}
          required
          rows={2}
          disabled={busy}
        />
        <button
          type="submit"
          className={`green-button ${token.trim() && !busy ? "ready-to-submit" : ""}`}
          disabled={busy || !token.trim()}
        >
          {busy ? "CONFERINDO…" : "VALIDAR CARTELA"}
        </button>
      </form>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {result && combination && (
        <div className="validation-result" ref={resultRef}>
          <div className="paper result-note" role="status">
            <strong
              className={result.verified ? "verified-label" : "trust-label"}
            >
              <Icon
                name={result.verified ? "check" : "warning"}
                width={19}
                height={19}
                className="inline-icon"
              />{" "}
              {result.verified
                ? "Assinatura verificada"
                : "Cartela não verificada"}
            </strong>
            <p>
              {result.card.kind === "unsigned"
                ? result.card.payload.name
                : `Cartela ${result.card.payload.cid}`}
            </p>
            <h3>
              {combination.won
                ? "BINGO! Combinação completa."
                : "Ainda não deu Bingo."}
            </h3>
            <p>
              {PATTERN_LABELS[pattern]} · {combination.matched}/24 números
              sorteados.
            </p>
            {!combination.won && (
              <p className="help-text">
                Faltam na combinação mais próxima:{" "}
                {combination.closest.missing.map(ballLabel).join(", ")}.
              </p>
            )}
            <p className="help-text">
              {result.verified
                ? "Assinatura confirma origem e identidade. Não comprova inscrição em uma partida remota."
                : "O código confere os números, mas não comprova autoria ou autenticidade."}{" "}
              Conferência contra as pedras deste navegador.
            </p>
          </div>
          <BingoCard
            nums={result.card.payload.nums}
            drawn={drawn}
            caption="Os contornos indicam pedras já sorteadas."
          />
        </div>
      )}
    </section>
  );
}
