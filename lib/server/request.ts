import "server-only";
/** Bound actual bytes, including chunked requests without Content-Length. */
export async function readJson(
  request: Request,
  maxBytes = 12000,
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Corpo ausente.");
  let size = 0;
  const decoder = new TextDecoder();
  let raw = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Requisição muito grande.");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Objeto esperado.");
    return parsed as Record<string, unknown>;
  } finally {
    reader.releaseLock();
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
