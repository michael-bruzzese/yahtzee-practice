import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playful Yahtzee",
  description: "Pass-and-play Yahtzee built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
