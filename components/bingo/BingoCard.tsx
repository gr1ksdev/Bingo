import type { ReactNode } from "react";
import { LETTERS } from "@/lib/bingo/constants";
import type { CardNumbers, Marks } from "@/lib/bingo/types";
import type { CardStamp } from "@/lib/stamps";
import { BingoCell } from "./BingoCell";
import { Icon } from "@/components/ui/Icon";
export function BingoCard({
  nums,
  marks = {},
  onMark,
  stamps = [],
  actionLabel,
  children,
  drawn = [],
  caption = "Um pouquinho de sorte. Um montão de tinta.",
}: {
  nums: CardNumbers;
  marks?: Marks;
  stamps?: CardStamp[];
  actionLabel?: string;
  onMark?: (i: number) => void;
  children?: ReactNode;
  drawn?: number[];
  caption?: string;
}) {
  return (
    <section className="bingo-paper" aria-label="Cartela de Bingo">
      <div className="card-topline">
        <span>BINGO DE MESA</span>
        <span>75 pedras · boa sorte!</span>
      </div>
      <div className="card-surface">
        <div className="letter-row" aria-hidden="true">
          {LETTERS.map((letter, i) => (
            <div key={letter} className={`letter letter-${i}`}>
              {letter}
            </div>
          ))}
        </div>
        <div className="number-grid">
          {nums.map((number, i) => (
            <BingoCell
              key={i}
              index={i}
              number={number}
              color={marks[i]}
              onMark={onMark}
              actionLabel={actionLabel}
              stamps={stamps.filter((s) => s.cellIndex === i)}
              highlighted={number !== null && drawn.includes(number)}
            />
          ))}
        </div>
        {children}
      </div>
      <p className="card-caption">
        {caption}
        <Icon name="star" width={14} height={14} />
      </p>
    </section>
  );
}
