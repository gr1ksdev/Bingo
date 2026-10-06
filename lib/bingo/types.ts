export type {
  CardNumbers,
  UnsignedCard,
  SignedCard,
  CardPayload,
} from "./token/types";

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
  card: import("./token/types").UnsignedCard;
  color: string;
  marks: Marks;
  strokes: Stroke[];
};
