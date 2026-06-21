import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncTriage | Tame Your Meeting Chaos",
  description: "Extract action items, decisions, and open questions from your meeting transcripts instantly using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
