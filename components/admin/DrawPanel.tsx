import { BingoBall } from "@/components/bingo/BingoBall";
import { Icon } from "@/components/ui/Icon";
export function DrawPanel({
  drawn,
  onDraw,
}: {
  drawn: number[];
  onDraw: () => void;
}) {
  const current = drawn.at(-1) ?? null;
  return (
    <section className="draw-panel">
      <h2 className="paper-strip">Pedra da vez</h2>
      <div className="draw-panel-body">
        <div
          key={current}
          className="current-ball"
          aria-live="polite"
          aria-atomic="true"
        >
          <BingoBall number={current} />
        </div>
        <div className="draw-controls">
          <button
            className="primary-button draw-button"
            onClick={onDraw}
            disabled={drawn.length === 75}
          >
            <Icon name="shuffle" />
            <span>
              {drawn.length === 75 ? "Todas saíram!" : "SORTEAR PEDRA"}
            </span>
          </button>
          <div className="paper draw-counter">
            <span>Pedras sorteadas</span>
            <strong>
              {drawn.length}
              <small> / 75</small>
            </strong>
            <i aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
