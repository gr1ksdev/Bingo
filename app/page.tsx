import Link from "next/link";
import { BingoCard } from "@/components/bingo/BingoCard";
import { Icon } from "@/components/ui/Icon";
import { DEFAULT_COLOR } from "@/lib/bingo/constants";
const demo = [
  7,
  19,
  34,
  46,
  63,
  9,
  27,
  41,
  52,
  68,
  14,
  23,
  null,
  57,
  75,
  3,
  28,
  36,
  49,
  71,
  11,
  22,
  38,
  54,
  66,
];
export default function HomePage() {
  return (
    <main className="app-shell landing-shell">
      <header className="landing-header">
        <span className="brand-mark">
          bingo<span>de mesa</span>
        </span>
        <span className="edition-label">
          PAPEL, TINTA
          <br />& BOA COMPANHIA
        </span>
      </header>
      <section className="landing-intro">
        <p className="paper-strip">A sorte está na mesa.</p>
        <h1>
          Seu velho Bingo.
          <br />
          <em>Uma nova brincadeira.</em>
        </h1>
        <p>
          Escolha uma canetinha, rabisque sua cartela
          <br className="desktop-break" /> e deixe os bons momentos acontecerem.
        </p>
      </section>
      <div className="landing-card">
        <BingoCard
          nums={demo}
          marks={{
            2: DEFAULT_COLOR,
            5: DEFAULT_COLOR,
            8: DEFAULT_COLOR,
            16: DEFAULT_COLOR,
            19: DEFAULT_COLOR,
            23: DEFAULT_COLOR,
          }}
          caption="A próxima pedra pode ser a sua."
        />
        <span className="landing-doodle" aria-hidden="true">
          essa vai sair!{" "}
          <Icon
            name="arrow"
            width={18}
            height={18}
            className="inline-icon"
            style={{ transform: "rotate(-40deg)" }}
          />
        </span>
      </div>
      <div className="landing-cta">
        <Link href="/play" className="primary-button">
          QUERO JOGAR <Icon name="arrow" />
        </Link>
        <Link href="/admin" className="organizer-link">
          Vou organizar a mesa <Icon name="arrow" width={18} />
        </Link>
      </div>
      <div className="landing-features">
        <span>
          <Icon name="star" width={13} height={13} className="inline-icon" /> 75
          pedras
        </span>
        <span>
          <Icon name="pen" width={13} height={13} className="inline-icon" /> Do
          seu jeito
        </span>
        <span>
          <Icon name="heart" width={13} height={13} className="inline-icon" />{" "}
          Sem cadastro
        </span>
      </div>
      <p className="footer-note">
        Sua primeira mesa é local, salva neste navegador.
      </p>
    </main>
  );
}
