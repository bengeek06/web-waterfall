import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Waterfall - Gestion de projet",
  description: "Une application de gestion de projet qui permet aux utilisateurs de gérer efficacement les projets, les jalons et les livrables.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'Geist Sans, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
