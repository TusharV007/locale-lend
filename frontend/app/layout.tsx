import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


import { Providers } from "./providers";
import { TopProgressBar } from "@/components/TopProgressBar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Local Share",
  description: "Neighborhood lending platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>
          <TopProgressBar />
          {children}
          <Toaster position="top-center" expand={true} richColors />
        </Providers>
      </body>
    </html>
  );
}
