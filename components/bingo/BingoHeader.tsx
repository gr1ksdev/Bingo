import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
export function BingoHeader({
  title,
  subtitle,
  admin = false,
}: {
  title: string;
  subtitle: string;
  admin?: boolean;
}) {
  return (
    <header className="game-header">
      <Link href="/" className="round-button" aria-label="Voltar ao início">
        <Icon name="back" />
      </Link>
      <div className="header-labels">
        <h1 className="paper-strip">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>
      <Link href={admin ? "/play" : "/admin"} className="mode-link">
        {admin ? "Jogar" : "Admin"}
        <Icon name="arrow" width={15} height={15} />
      </Link>
    </header>
  );
}
