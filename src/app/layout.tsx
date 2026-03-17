import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Placement Factors",
  description:
    "NIST workshop tool for building and visualizing class placement factor priorities."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

