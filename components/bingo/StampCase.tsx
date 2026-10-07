import { useId, type CSSProperties } from "react";
import { STAMP_TYPES, TOOL_LABELS, type SelectedTool } from "@/lib/stamps";
import { StampGlyph } from "./StampGlyph";
import { MarkerCase } from "./MarkerCase";
import { CaseZipper, ZipperPull } from "./CaseZipper";

export function StampCase({
  selectedTool,
  selectedColor,
  onTool,
  onColor,
  open = true,
  onOpenChange,
}: {
  selectedTool: SelectedTool;
  selectedColor: string;
  onTool: (tool: SelectedTool) => void;
  onColor: (color: string) => void;
  open?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentId = useId();
  const activeGlyph =
    selectedTool === "mark" || selectedTool === "eraser" ? null : selectedTool;
  return (
    <section
      className={`stamp-case ${open ? "case-open" : "case-closed"}`}
      aria-label="Estojo de carimbos e canetinhas"
    >
      <div className="case-fabric-flap" aria-hidden="true" />
      <div className="case-seam" aria-hidden="true" />
      <div
        className="case-reveal"
        id={contentId}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="case-reveal-clip">
          <div className="case-interior">
            <h2 className="case-wood-label">
              <StampGlyph type="star" /> MEUS CARIMBOS{" "}
              <StampGlyph type="star" />
            </h2>
            <div className="stamp-nest">
              {[...STAMP_TYPES, "freehand" as const].map((tool, i) => (
                <button
                  key={tool}
                  type="button"
                  className="wood-stamp"
                  style={
                    {
                      "--tilt": `${[-2, 1, -1, 2, -2, 1, 2, -1, 1, -2, 2, -1][i]}deg`,
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
          </div>
        </div>
      </div>
      <div className="case-lid" aria-hidden="true">
        <span className="case-worn-print print-star">
          <StampGlyph type="star" seed={391} />
        </span>
        <span className="case-worn-print print-flower">
          <StampGlyph type="flower" seed={711} />
        </span>
        <span className="case-worn-print print-paw">
          <StampGlyph type="paw" seed={245} />
        </span>
        <span className="case-patch">
          <span>
            MEUS
            <br />
            CARIMBOS
          </span>
          <span className="case-held-tool" style={{ color: selectedColor }}>
            {activeGlyph ? (
              <StampGlyph type={activeGlyph} />
            ) : (
              <svg
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                aria-hidden="true"
              >
                <path
                  d={
                    selectedTool === "mark"
                      ? "M32 9 C60 8 62 54 32 55 C3 55 3 7 32 9 Z"
                      : "M13 42 L37 10 L55 24 L29 56 L13 42 Z M23 30 L42 44"
                  }
                />
              </svg>
            )}
          </span>
        </span>
      </div>
      <CaseZipper open={open} />
      <button
        className="case-pull"
        type="button"
        aria-label={
          open ? "Fechar estojo de carimbos" : "Abrir estojo de carimbos"
        }
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => onOpenChange(!open)}
      >
        <ZipperPull />
      </button>
    </section>
  );
}
