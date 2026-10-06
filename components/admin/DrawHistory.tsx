import { ballLabel } from "@/lib/bingo/constants";
import { Icon } from "@/components/ui/Icon";
export function DrawHistory({ drawn }: { drawn: number[] }) {
  return (
    <details className="paper history">
      <summary>
        Histórico completo{" "}
        <span>
          {drawn.length} pedras{" "}
          <Icon
            name="arrow"
            width={12}
            height={12}
            className="inline-icon"
            style={{ transform: "rotate(90deg)" }}
          />
        </span>
      </summary>
      {drawn.length ? (
        <ol className="history-grid">
          {drawn.map((n, i) => (
            <li key={n}>
              <small>{String(i + 1).padStart(2, "0")}.</small>
              <strong>{ballLabel(n)}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="help-text">Nenhuma pedra sorteada ainda.</p>
      )}
    </details>
  );
}
