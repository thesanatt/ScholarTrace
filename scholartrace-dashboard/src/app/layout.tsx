import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarTrace — Professor Dashboard",
  description:
    "Monitor and review student coding activity with tamper-proof edit timelines.",
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
