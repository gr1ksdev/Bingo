import { BingoBall } from "./BingoBall";
export function RecentBalls({ drawn }: { drawn: number[] }) {
  return (
    <section className="recent-section">
      <h2 className="paper-strip">Últimas pedras</h2>
      <div className="recent-balls">
        {drawn.length ? (
          drawn
            .slice(-6)
            .reverse()
            .map((n) => <BingoBall key={n} number={n} small />)
        ) : (
          <p className="empty-note">A primeira pedra está quase saindo…</p>
        )}
      </div>
    </section>
  );
}
