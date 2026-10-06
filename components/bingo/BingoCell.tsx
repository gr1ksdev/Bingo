import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
export function BingoCell({
  number,
  index,
  color,
  onMark,
  highlighted = false,
}: {
  number: number | null;
  index: number;
  color?: string;
  onMark?: (i: number) => void;
  highlighted?: boolean;
}) {
  const mark = color ? (
    <span
      className="ink-daub"
      style={
        {
          "--mark-color": color,
          "--mark-angle": `${((index * 17) % 31) - 15}deg`,
          "--mark-x": `${(index % 3) - 1}px`,
          "--mark-scale": 0.88 + (index % 4) * 0.035,
        } as CSSProperties
      }
    />
  ) : null;
  const content =
    number === null ? (
      <span className="free-star" aria-label="Casa livre">
        <Icon name="star" fill="currentColor" strokeWidth={0} />
        <small>LIVRE</small>
      </span>
    ) : (
      <>
        {mark}
        <span className="cell-number">{String(number).padStart(2, "0")}</span>
      </>
    );
  return onMark && number !== null ? (
    <button
      type="button"
      className={`bingo-cell ${highlighted ? "matched" : ""}`}
      onClick={() => onMark(index)}
      aria-label={`Número ${number}${color ? ", marcado" : ""}`}
      aria-pressed={!!color}
    >
      {content}
    </button>
  ) : (
    <div className={`bingo-cell ${highlighted ? "matched" : ""}`}>
      {content}
    </div>
  );
}
