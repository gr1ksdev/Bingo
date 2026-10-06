import Link from "next/link";
export default function NotFound() {
  return (
    <main className="app-shell">
      <section className="paper result-note">
        <h1>Essa pedra não está na mesa.</h1>
        <p>Página não encontrada.</p>
        <Link href="/" className="secondary-button">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
