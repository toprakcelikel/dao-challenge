import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAO Challenge",
  description: "Davidson Academy Online — Group Challenge Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
