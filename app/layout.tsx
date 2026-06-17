import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Intercontinental Crest — Global Banking. Trusted Worldwide.",
    template: "%s | Intercontinental Crest",
  },
  description:
    "Intercontinental Crest offers secure digital banking, international transfers, investment solutions, and lending services trusted by millions worldwide.",
  keywords: [
    "international banking",
    "digital banking",
    "online bank",
    "investment solutions",
    "loans",
    "wealth management",
    "intercontinental crest",
  ],
  authors: [{ name: "Intercontinental Crest" }],
  creator: "Intercontinental Crest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://intercontinentalcrest.com",
    title: "Intercontinental Crest — Global Banking. Trusted Worldwide.",
    description:
      "Secure digital banking, investments, savings, and lending services for individuals and businesses worldwide.",
    siteName: "Intercontinental Crest",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intercontinental Crest",
    description: "Global Banking. Trusted Worldwide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
