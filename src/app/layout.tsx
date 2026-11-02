import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Hacker Times - Hacker News, Front Page",
    template: "%s - The Hacker Times",
  },
  description: "Hacker News, set in type like a broadsheet newspaper.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout applies to every page */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Libre+Franklin:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap"
        />
      </head>
      <body>
        <div className="page">
          <Masthead />
          <main>{children}</main>
          <footer className="footer">
            <span className="footer__title">The Hacker Times</span>
            <p>
              All stories and comments come from{" "}
              <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer">
                Hacker News
              </a>
              . This is an unofficial reader; it is not affiliated with Y Combinator or The New York Times.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
