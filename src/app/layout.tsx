import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placement Priorities Live",
  description:
    "Workshop tool for building and visualizing placement priority stacks."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">
              Placement Priorities Live
            </h1>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

