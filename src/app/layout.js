import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Taoleia - La tua guida turistica virtuale",
  description: "Esplora luoghi, attività e ristoranti con Taoleia, la tua guida turistica virtuale alimentata dall'intelligenza artificiale",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#0e3740",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Taoleia"
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0e3740" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
