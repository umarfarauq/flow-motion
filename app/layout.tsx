import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowMotion AI",
  description: "Visual AI workflow builder for motion graphics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
