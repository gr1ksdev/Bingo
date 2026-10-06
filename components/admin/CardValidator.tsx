"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { parseToken, type ParsedToken, type SignedCard, type UnsignedCard } from "@/lib/bingo/token";
import { validateBingo } from "@/lib/bingo/validation";
import { ballLabel, PATTERN_LABELS } from "@/lib/bingo/constants";
import type { WinPattern } from "@/lib/bingo/types";
import { BingoCard } from "@/components/bingo/BingoCard";
import { Icon } from "@/components/ui/Icon";

type ValidationStatus = "signed-valid" | "unsigned" | "invalid-signature";

interface ValidationState {
  status: ValidationStatus;
  card: ParsedToken;
  signedPayload?: SignedCard;
  unsignedPayload?: UnsignedCard;
}

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
  const [validation, setValidation] = useState<ValidationState | null>(null);

  useEffect(() => {
    if (validation) {
      resultRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [validation]);

  async function validate(event: FormEvent) {
    event.preventDefault();
    setValidation(null);
    setError("");
    setBusy(true);

    try {
      const cleanToken = token.trim();
      const parsed = parseToken(cleanToken);

      if (parsed.kind === "unsigned") {
        setValidation({
          status: "unsigned",
          card: parsed,
          unsignedPayload: parsed.payload,
        });
        return;
      }

      // Signed token: verify with server
      const response = await fetch("/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleanToken }),
        signal: AbortSignal.timeout(10000),
      });

      const body = await response.json();

      if (response.ok && (body.signatureValid === true || body.verified === true)) {
        setValidation({
          status: "signed-valid",
          card: parsed,
          signedPayload: body.payload ?? parsed.payload,
        });
      } else if (
        body.error?.code === "INVALID_SIGNATURE" ||
        body.signatureValid === false ||
        (!response.ok && body.error?.includes?.("Assinatura inválida"))
      ) {
        setValidation({
          status: "invalid-signature",
          card: parsed,
          signedPayload: parsed.payload,
        });
      } else {
        throw new Error(
          body.error?.message || body.error || "Não foi possível verificar a assinatura.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  const combination = validation
    ? validateBingo(validation.card.payload.nums, drawn, pattern)
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
            setValidation(null);
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

      {validation && combination && (
        <div className="validation-result" ref={resultRef}>
          <div className="paper result-note" role="status">
            {validation.status === "signed-valid" && (
              <>
                <strong className="verified-label">
                  <Icon
                    name="check"
                    width={19}
                    height={19}
                    className="inline-icon"
                  />{" "}
                  CARTELA VERIFICADA
                </strong>
                <p>
                  <strong>Cartela:</strong> {validation.signedPayload?.cid}
                  <br />
                  <strong>Partida:</strong> {validation.signedPayload?.gid}
                  <br />
                  <strong>Usuário:</strong>{" "}
                  {validation.signedPayload?.name
                    ? `${validation.signedPayload.name} (${validation.signedPayload?.uid ?? "anônimo"})`
                    : (validation.signedPayload?.uid ?? "anônimo")}
                </p>
                <h3>
                  {combination.won
                    ? "BINGO! Combinação completa."
                    : "Ainda não deu Bingo."}
                </h3>
                <p>
                  {PATTERN_LABELS[pattern]} · {combination.matched}/24 números sorteados.
                </p>
                {!combination.won && (
                  <p className="help-text">
                    Faltam na combinação mais próxima:{" "}
                    {combination.closest.missing.map(ballLabel).join(", ")}.
                  </p>
                )}
                <p className="help-text">
                  ✓ Assinatura válida (HMAC-SHA256). Origem e integridade da cartela confirmadas pelo servidor.
                </p>
              </>
            )}

            {validation.status === "unsigned" && (
              <>
                <strong className="trust-label">
                  <Icon
                    name="warning"
                    width={19}
                    height={19}
                    className="inline-icon"
                  />{" "}
                  CARTELA NÃO VERIFICADA
                </strong>
                <p>
                  <strong>Nome:</strong> {validation.unsignedPayload?.name}
                </p>
                <p className="help-text">
                  A combinação pode ser conferida, mas a origem da cartela não possui assinatura.
                </p>
                <h3>
                  {combination.won
                    ? "BINGO! Combinação completa."
                    : "Ainda não deu Bingo."}
                </h3>
                <p>
                  {PATTERN_LABELS[pattern]} · {combination.matched}/24 números sorteados.
                </p>
                {!combination.won && (
                  <p className="help-text">
                    Faltam na combinação mais próxima:{" "}
                    {combination.closest.missing.map(ballLabel).join(", ")}.
                  </p>
                )}
              </>
            )}

            {validation.status === "invalid-signature" && (
              <>
                <strong className="invalid-label">
                  <Icon
                    name="close"
                    width={19}
                    height={19}
                    className="inline-icon"
                  />{" "}
                  ASSINATURA INVÁLIDA
                </strong>
                <p className="notice" style={{ borderColor: "var(--red)" }}>
                  Esta cartela foi adulterada ou assinada com chave não autorizada.
                  <br />
                  <strong>
                    Não validada como cartela confiável mesmo se os números aparentemente formarem Bingo.
                  </strong>
                </p>
                <p>
                  <strong>Cartela rejeitada:</strong> {validation.signedPayload?.cid}
                </p>
              </>
            )}
          </div>

          <BingoCard
            nums={validation.card.payload.nums}
            drawn={drawn}
            caption={
              validation.status === "invalid-signature"
                ? "Cartela rejeitada: assinatura não confere."
                : "Os contornos indicam pedras já sorteadas."
            }
          />
        </div>
      )}
    </section>
  );
}
