import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const displaySerif = localFont({
  src: [
    { path: "./fonts/bodoni-moda/regular.ttf", style: "normal", weight: "400 700" },
    { path: "./fonts/bodoni-moda/italic.ttf", style: "italic", weight: "400 700" },
  ],
  variable: "--font-display-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const bodySans = localFont({
  src: "./fonts/instrument-sans/regular.ttf",
  weight: "400 700",
  style: "normal",
  variable: "--font-body-sans",
  display: "swap",
});

const accentSerif = localFont({
  src: [
    { path: "./fonts/cormorant-garamond/regular.ttf", style: "normal", weight: "400 600" },
    { path: "./fonts/cormorant-garamond/italic.ttf", style: "italic", weight: "400 600" },
  ],
  variable: "--font-accent-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://murtazasarrah.ca"),
  title: "Murtaza & Sarrah",
  description: "We're getting married — October 2026",
  openGraph: {
    title: "Murtaza & Sarrah",
    description: "We're getting married — October 2026",
    siteName: "Murtaza & Sarrah",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Murtaza & Sarrah",
    description: "We're getting married — October 2026",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} ${accentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body overflow-x-hidden w-full text-foreground relative">
        {children}
      </body>
    </html>
  );
}
