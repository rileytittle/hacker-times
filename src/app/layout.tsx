import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hacker Times",
    template: "%s · Hacker Times",
  },
  description: "A calmer, more readable way to read Hacker News.",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
        />
      </head>
      <body>
        <SiteHeader />
        <main className="main">{children}</main>
        <footer className="footer">
          Stories and comments from{" "}
          <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer">
            Hacker News
          </a>
          . Unofficial reader, not affiliated with Y Combinator.
        </footer>
      </body>
    </html>
  );
}
