import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobTrack AI — Your job search, in motion",
  description: "Track every opportunity and make your next move with JobTrack AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
