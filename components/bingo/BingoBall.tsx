import { ballLetter } from "@/lib/bingo/constants";
import { Icon } from "@/components/ui/Icon";
export function BingoBall({
  number,
  small = false,
}: {
  number: number | null;
  small?: boolean;
}) {
  return (
    <div
      className={`bingo-ball ${small ? "ball-small" : ""} ball-${number ? Math.floor((number - 1) / 15) : 4}`}
      aria-label={
        number
          ? `Pedra ${ballLetter(number)} ${number}`
          : "Nenhuma pedra sorteada"
      }
    >
      <div className="ball-face">
        <span>
          {number ? (
            ballLetter(number)
          ) : (
            <Icon name="star" width={18} height={18} />
          )}
        </span>
        <strong>{number ? String(number).padStart(2, "0") : "?"}</strong>
      </div>
    </div>
  );
}
