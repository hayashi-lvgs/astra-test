import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUNEV ONE — Premium Wireless Headphones",
  description: "Interactive 3D product experience for the fictional premium audio brand LUNEV.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
