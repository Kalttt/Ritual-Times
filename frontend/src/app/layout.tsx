import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair'
});

const lora = Lora({ 
  subsets: ["latin"],
  variable: '--font-lora'
});

export const metadata: Metadata = {
  title: "The Ritual Times - Crypto Reporter",
  description: "Autonomous Crypto Market Reporter built on Ritual Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  );
}
