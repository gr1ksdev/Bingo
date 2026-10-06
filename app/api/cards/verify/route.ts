import { getSigningSecret, verifyCard } from "@/lib/server/signing";
import { json, readJson } from "@/lib/server/request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = getSigningSecret();
  if (!secret)
    return json(
      { error: "Verificação de assinatura indisponível neste ambiente." },
      503,
    );
  try {
    const body = await readJson(request);
    if (typeof body.token !== "string")
      return json({ error: "Código ausente." }, 400);
    return json({ verified: true, payload: verifyCard(body.token, secret) });
  } catch {
    return json({ error: "Código ou assinatura inválida." }, 400);
  }
}
