export function encodeBase64Url(text: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeBase64Url(input: string): string {
  if (
    !/^[A-Za-z0-9_-]+$/.test(input) ||
    input.length > 4096 ||
    input.length % 4 === 1
  ) {
    throw new Error("Base64URL inválido.");
  }

  const bytes = Uint8Array.from(
    atob(input.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );

  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (encodeBase64Url(decoded) !== input) {
    throw new Error("Base64URL não canônico.");
  }

  return decoded;
}
