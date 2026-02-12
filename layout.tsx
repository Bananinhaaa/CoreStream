import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreStream",
  description: "Rede social de vídeos de Scripter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoreStream",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Fix: Importando React para utilizar o namespace React.ReactNode no TypeScript
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className="antialiased overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
