import type { Metadata } from "next";
import { Cormorant, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
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
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body overflow-x-hidden w-full text-foreground relative">
        {children}
      </body>
    </html>
  );
}
