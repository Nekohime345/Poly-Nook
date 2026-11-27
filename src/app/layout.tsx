import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poly Nook - a little world of 3D things",
  description: "Find, preview, and download thoughtful 3D models made by artists.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
