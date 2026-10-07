import type { CSSProperties } from "react";
import { STAMP_TYPES, TOOL_LABELS, type SelectedTool } from "@/lib/stamps";
import { StampGlyph } from "./StampGlyph";
import { MarkerCase } from "./MarkerCase";
export function StampCase({
  selectedTool,
  selectedColor,
  onTool,
  onColor,
}: {
  selectedTool: SelectedTool;
  selectedColor: string;
  onTool: (tool: SelectedTool) => void;
  onColor: (color: string) => void;
}) {
  return (
    <section
      className="stamp-case"
      aria-label="Estojo de carimbos e canetinhas"
    >
      <h2>MEUS CARIMBOS</h2>
      <div className="stamp-nest">
        {[...STAMP_TYPES, "freehand" as const].map((tool, i) => (
          <button
            key={tool}
            type="button"
            className="wood-stamp"
            style={
              {
                "--tilt": `${[-2, 1, -1, 2, -2, 1, -1][i]}deg`,
                color: selectedColor,
              } as CSSProperties
            }
            aria-label={
              tool === "freehand"
                ? "Usar desenho livre"
                : `Usar carimbo ${TOOL_LABELS[tool]}`
            }
            aria-pressed={selectedTool === tool}
            onClick={() => onTool(tool)}
          >
            <span className="stamp-face">
              <StampGlyph type={tool} />
            </span>
            <span className="stamp-name">{TOOL_LABELS[tool]}</span>
          </button>
        ))}
      </div>
      <MarkerCase color={selectedColor} onSelect={onColor} />
    </section>
  );
}
