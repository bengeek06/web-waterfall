import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Waterfall - Gestion de projet",
  description: "Une application de gestion de projet qui permet aux utilisateurs de gérer efficacement les projets, les jalons et les livrables.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
    return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
