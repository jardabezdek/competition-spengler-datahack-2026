import type { Metadata } from "next";
import { montserrat } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "U.S. Collegiate Selects vs. HC Davos | Spengler Cup",
  description: "Game center for the Spengler Cup final on 31 December 2025.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
