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
  title: "Taoleia - La tua guida turistica AI",
  description: "Scopri luoghi, attività e cultura con la tua guida turistica AI personale",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#E3742E",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Taoleia",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      }
    ]
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true
  },
  applicationName: "Taoleia",
  referrer: "origin-when-cross-origin",
  keywords: ["guida turistica", "AI", "intelligenza artificiale", "turismo", "viaggi", "attività", "cultura"],
  authors: [{ name: "Taoleia Team" }],
  creator: "Taoleia Team",
  publisher: "Taoleia",
  openGraph: {
    title: "Taoleia - La tua guida turistica AI",
    description: "Scopri luoghi, attività e cultura con la tua guida turistica AI personale",
    url: "https://taoleia.com",
    siteName: "Taoleia",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Taoleia Logo"
      }
    ],
    locale: "it_IT",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Taoleia - La tua guida turistica AI",
    description: "Scopri luoghi, attività e cultura con la tua guida turistica AI personale",
    images: ["/android-chrome-512x512.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#E3742E" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Taoleia" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E3742E" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
