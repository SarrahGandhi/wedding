import type { Metadata } from "next";
import { Bodoni_Moda, Instrument_Sans } from "next/font/google";
import "./globals.css";

const displaySerif = Bodoni_Moda({
  variable: "--font-display-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const bodySans = Instrument_Sans({
  variable: "--font-body-sans",
  subsets: ["latin"],
  display: "swap",
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
      className={`${displaySerif.variable} ${bodySans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body overflow-x-hidden w-full text-foreground relative">
        {children}
      </body>
    </html>
  );
}
