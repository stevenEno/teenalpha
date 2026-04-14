import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// DESIGN.md fonts: Cabinet Grotesk (display) + Plus Jakarta Sans (body) + Geist Mono (data).
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Self-hosted via Fontshare (free for commercial use). Variable file gives every
// weight in one ~70KB request; preload + swap keep CLS at zero.
const display = localFont({
  src: "../public/fonts/cabinet-grotesk/CabinetGrotesk-Variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-display",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Teen Alpha",
  description: "Build ambitious projects with AI guidance and mentorship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}