import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bingo de mesa — papel, tinta e sorte",
  description:
    "Uma cartela, suas canetinhas e um pouquinho de sorte. Jogue Bingo na sua mesa digital.",
  applicationName: "Bingo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bingo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#55321e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
