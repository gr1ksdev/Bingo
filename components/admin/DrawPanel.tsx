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
  const isFinished = drawn.length === 75;

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
          {isFinished ? (
            <div className="draw-finished-banner" role="status">
              <Icon
                name="check"
                width={22}
                height={22}
                className="inline-icon"
              />
              <strong>SORTEIO CONCLUÍDO!</strong>
              <span>Todas as 75 pedras foram cantadas.</span>
            </div>
          ) : (
            <button className="primary-button draw-button" onClick={onDraw}>
              <Icon name="shuffle" />
              <span>SORTEAR PEDRA</span>
            </button>
          )}
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
