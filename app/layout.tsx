import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wam Payment Tracker",
  description: "Track vendor payments at market events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
