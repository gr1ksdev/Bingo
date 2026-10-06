import { Icon } from "@/components/ui/Icon";
export type DrawingMode = "stamp" | "pen" | "eraser";
export function DrawingToolbar({
  mode,
  setMode,
  width,
  setWidth,
  undo,
  canUndo,
  clear,
}: {
  mode: DrawingMode;
  setMode: (mode: DrawingMode) => void;
  width: number;
  setWidth: (width: number) => void;
  undo: () => void;
  canUndo: boolean;
  clear: () => void;
}) {
  return (
    <div className="drawing-tools">
      <div className="mode-switch" aria-label="Modo de interação">
        <button
          aria-pressed={mode === "stamp"}
          onClick={() => setMode("stamp")}
        >
          <Icon name="stamp" />
          Marcar
        </button>
        <button aria-pressed={mode === "pen"} onClick={() => setMode("pen")}>
          <Icon name="pen" />
          Rabiscar
        </button>
        <button
          aria-pressed={mode === "eraser"}
          aria-label="Borracha dos rabiscos"
          onClick={() => setMode("eraser")}
        >
          <Icon name="eraser" />
        </button>
      </div>
      {mode !== "stamp" && (
        <div className="stroke-tools">
          <label>
            Traço{" "}
            <input
              aria-label="Espessura do traço"
              type="range"
              min="2"
              max="14"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>
          <button
            className="tool-button"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Desfazer último rabisco"
          >
            <Icon name="undo" />
          </button>
          <button
            className="tool-button"
            onClick={clear}
            disabled={!canUndo}
            aria-label="Limpar desenhos"
          >
            <Icon name="trash" />
          </button>
        </div>
      )}
    </div>
  );
}
