import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
export function MarkerPen({
  color,
  name,
  selected,
  onSelect,
}: {
  color: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`marker-slot ${selected ? "selected" : ""}`}
      aria-label={`Canetinha ${name.toLowerCase()}`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ "--pen-color": color } as CSSProperties}
    >
      <span className="marker-pen" aria-hidden="true">
        <span className="marker-cap" />
        <span className="marker-barrel">
          <span>BINGO</span>
        </span>
      </span>
      <span className="pen-indicator" aria-hidden="true">
        {selected ? <Icon name="check" width={12} height={12} /> : null}
      </span>
    </button>
  );
}
