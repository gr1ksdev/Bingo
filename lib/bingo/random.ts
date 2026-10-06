/** Rejection sampling avoids modulo bias; no Math.random fallback. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000)
    throw new Error("Limite aleatório inválido.");
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}
