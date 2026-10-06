export type CardNumbers = (number | null)[];
export type UnsignedCard = {
  v: 1;
  name: string;
  nums: CardNumbers;
  createdAt: number;
};
export type SignedCard = {
  v: 1;
  uid: number;
  gid: string;
  cid: string;
  nums: CardNumbers;
  iat: number;
};
export type CardPayload = UnsignedCard | SignedCard;
export type WinPattern = "line" | "column" | "diagonal" | "corners" | "full";
export type Point = { x: number; y: number };
export type Stroke = {
  id: string;
  color: string;
  width: number;
  tool: "pen" | "eraser";
  points: Point[];
};
export type Marks = Record<string, string>;
export type Game = {
  v: 1;
  id: string;
  drawn: number[];
  startedAt: number;
  pattern: WinPattern;
};
export type Player = {
  v: 1;
  card: UnsignedCard;
  color: string;
  marks: Marks;
  strokes: Stroke[];
};
