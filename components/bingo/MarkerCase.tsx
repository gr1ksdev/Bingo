import { COLORS } from "@/lib/bingo/constants";
import { MarkerPen } from "./MarkerPen";
import { Icon } from "@/components/ui/Icon";
export function MarkerCase({
  color,
  onSelect,
}: {
  color: string;
  onSelect: (color: string) => void;
}) {
  return (
    <section className="marker-section" aria-label="Estojo de canetinhas">
      <div className="case-label">
        <span className="paper-strip">Suas canetinhas</span>
        <span className="handwritten" aria-hidden="true">
          escolha a sua{" "}
          <Icon
            name="arrow"
            width={16}
            height={16}
            style={{ display: "inline", transform: "rotate(40deg)" }}
          />
        </span>
      </div>
      <div className="marker-case">
        <div className="case-lining">
          {COLORS.map((c) => (
            <MarkerPen
              key={c.id}
              color={c.hex}
              name={c.name}
              selected={color === c.hex}
              onSelect={() => onSelect(c.hex)}
            />
          ))}
        </div>
        <span className="zipper-pull" aria-hidden="true" />
      </div>
    </section>
  );
}
