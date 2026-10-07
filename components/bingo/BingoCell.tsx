import type { CSSProperties } from "react";
import type { CardStamp } from "@/lib/stamps";
import { StampGlyph } from "./StampGlyph";
import { Icon } from "@/components/ui/Icon";

export function getOrganicMarkStyle(
  index: number,
  number: number | null,
  color: string,
): CSSProperties {
  // Deterministic seed based on cell index and cell number.
  // Stable across reloads for persistent marks without altering storage structure.
  const seed = ((index + 1) * 37 + (number ?? 0) * 19) % 1000;
  const angle = (seed % 29) - 14 + (seed % 7) * 0.35;
  const x = (((seed * 7) % 5) - 2) * 0.75;
  const y = (((seed * 11) % 5) - 2) * 0.75;
  const scale = 0.89 + (seed % 9) / 110;
  const opacity = 0.51 + (seed % 7) * 0.01;
  const r1 = 40 + (seed % 14);
  const r2 = 51 + ((seed * 3) % 14);
  const r3 = 43 + ((seed * 5) % 14);
  const r4 = 49 + ((seed * 7) % 14);
  const r5 = 49 + ((seed * 2) % 14);
  const r6 = 43 + ((seed * 4) % 14);
  const r7 = 53 + ((seed * 6) % 14);
  const r8 = 47 + ((seed * 8) % 14);
  const borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`;
  const ringAngle = ((seed * 13) % 45) - 22;
  const ringRadius = `${r3}% ${r1}% ${r4}% ${r2}%`;

  return {
    "--mark-color": color,
    "--mark-angle": `${angle.toFixed(1)}deg`,
    "--mark-x": `${x.toFixed(1)}px`,
    "--mark-y": `${y.toFixed(1)}px`,
    "--mark-scale": scale.toFixed(2),
    "--mark-opacity": opacity.toFixed(2),
    "--mark-radius": borderRadius,
    "--mark-ring-angle": `${ringAngle.toFixed(1)}deg`,
    "--mark-ring-radius": ringRadius,
  } as CSSProperties;
}

export function BingoCell({
  number,
  index,
  color,
  onMark,
  highlighted = false,
  stamps = [],
  actionLabel,
}: {
  number: number | null;
  index: number;
  color?: string;
  onMark?: (i: number) => void;
  highlighted?: boolean;
  stamps?: CardStamp[];
  actionLabel?: string;
}) {
  const mark = color ? (
    <span
      className="ink-daub"
      style={getOrganicMarkStyle(index, number, color)}
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

  const impressions = stamps.map((s) => (
    <span
      key={s.id}
      className="stamp-ink"
      style={{
        color: s.color,
        opacity: s.opacity,
        transform: `translate(${s.offsetX}px, ${s.offsetY}px) rotate(${s.rotation}deg) scale(${s.scale})`,
      }}
    >
      <StampGlyph type={s.type} seed={s.seed} />
    </span>
  ));

  if (number === null && !onMark) {
    return (
      <div className={`bingo-cell ${highlighted ? "matched" : ""}`}>
        {impressions}
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`bingo-cell ${highlighted ? "matched" : ""}`}
      onClick={onMark ? () => onMark(index) : undefined}
      disabled={!onMark}
      aria-label={`${number === null ? "Casa livre" : `Número ${number}`}${color ? ", marcado" : ""}${actionLabel ? `, ${actionLabel}` : ""}`}
      aria-pressed={!!color}
    >
      {impressions}
      {content}
    </button>
  );
}
