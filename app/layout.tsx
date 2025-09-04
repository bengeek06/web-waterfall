import type { Metadata } from "next";
import "./globals.css";

let geistSans, geistMono;
if (process.env.OFFLINE_MODE === 'true') {
  const { Geist, Geist_Mono } = await import("next/font/google");
  geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
  geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
}

export const metadata: Metadata = {
  title: "Waterfall - Gestion de projet",
  description: "Une application de gestion de projet qui permet aux utilisateurs de gérer efficacement les projets, les jalons et les livrables.",
};

/* <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >*/

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
      <body>
        {children}
      </body>
    </html>
  );
}
