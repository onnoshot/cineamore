import type { Metadata, Viewport } from "next";
import "./globals.css";

const BRAND_NAME = "CineAmore";
const BRAND_TAGLINE = "İki kişi, bir aşk hikayesi, 12 saniye";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Sinematik Aşk Hikayesi Yarat`,
  description: BRAND_TAGLINE,
  keywords: ["aşk hikayesi", "yapay zeka video", "AI video", "TikTok", "Instagram"],
  openGraph: {
    title: `${BRAND_NAME} — Sinematik Aşk Hikayesi`,
    description: BRAND_TAGLINE,
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: BRAND_TAGLINE,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_NAME,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="h-full">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full bg-black antialiased">
        {children}
      </body>
    </html>
  );
}
