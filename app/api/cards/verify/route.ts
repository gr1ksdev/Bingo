import { getSigningSecret, verifyToken } from "@/lib/server/signing";
import { json, readJson } from "@/lib/server/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = getSigningSecret();
  if (!secret) {
    return json(
      {
        valid: false,
        verified: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Verificação de assinatura indisponível neste ambiente.",
        },
      },
      503,
    );
  }

  try {
    const body = await readJson(request);
    if (typeof body.token !== "string" || !body.token.trim()) {
      return json(
        {
          valid: false,
          verified: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Código ausente.",
          },
        },
        400,
      );
    }

    const result = verifyToken(body.token.trim(), secret);

    if (result.valid) {
      return json({
        valid: true,
        verified: result.signatureValid,
        kind: result.kind,
        signatureValid: result.signatureValid,
        payload: result.payload,
      });
    }

    return json(
      {
        valid: false,
        verified: false,
        kind: result.kind,
        signatureValid: false,
        error: result.error,
        payload: result.payload,
      },
      400,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Código ou assinatura inválida.";
    return json(
      {
        valid: false,
        verified: false,
        error: {
          code: "INVALID_REQUEST",
          message,
        },
      },
      400,
    );
  }
}
