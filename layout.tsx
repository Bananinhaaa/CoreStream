
import React from "react";
import "./globals.css";

// Usando 'any' temporariamente para os tipos de metadados se o módulo 'next' não puder ser resolvido pelo compilador TS local
export const metadata: any = {
  title: "CoreStream",
  description: "Rede social de vídeos de Scripter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoreStream",
  },
  manifest: "/manifest.json",
};

export const viewport: any = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
