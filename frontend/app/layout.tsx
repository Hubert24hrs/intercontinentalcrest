import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1f33",
};

export const metadata: Metadata = {
  title: {
    default: "Intercontinental Crest | Online banking",
    template: "%s · Intercontinental Crest",
  },
  description:
    "Checking and savings accounts, transfers, bill pay, loans, investing and crypto in one dashboard. Intercontinental Crest is a demo platform and all balances are simulated.",
  applicationName: "Intercontinental Crest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Intercontinental Crest",
    title: "Intercontinental Crest | Online banking",
    description: "Online banking demo platform. Balances and transactions are simulated.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intercontinental Crest",
    description: "Online banking demo platform.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
