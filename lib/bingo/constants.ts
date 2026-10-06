export const LETTERS = ["B", "I", "N", "G", "O"] as const;
export const COLORS = [
  { id: "red", name: "Vermelha", hex: "#d83936" },
  { id: "orange", name: "Laranja", hex: "#e77d19" },
  { id: "yellow", name: "Amarela", hex: "#edb623" },
  { id: "green", name: "Verde", hex: "#20875b" },
  { id: "blue", name: "Azul", hex: "#2374cc" },
  { id: "purple", name: "Roxa", hex: "#873ec2" },
  { id: "pink", name: "Rosa", hex: "#db4c91" },
] as const;
export const DEFAULT_COLOR = COLORS[5].hex;
export const PATTERN_LABELS = {
  line: "Linha",
  column: "Coluna",
  diagonal: "Diagonal",
  corners: "Quatro cantos",
  full: "Cartela cheia",
} as const;
export function ballLetter(n: number) {
  return LETTERS[Math.floor((n - 1) / 15)];
}
export function ballLabel(n: number) {
  return `${ballLetter(n)}-${String(n).padStart(2, "0")}`;
}
