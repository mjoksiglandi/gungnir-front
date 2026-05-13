import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { siteUrl } from "@/shared/site";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Gugnir Console",
    template: "%s | Gugnir Console",
  },
  description: "Operational command surface for geospatial monitoring and coordination.",
  applicationName: "Gugnir Console",
  keywords: ["operations", "command", "geospatial", "monitoring", "incident response"],
  authors: [{ name: "Gugnir" }],
  creator: "Gugnir",
  openGraph: {
    title: "Gugnir Console",
    description: "Operational command surface for geospatial monitoring and coordination.",
    siteName: "Gugnir Console",
    locale: "en_US",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gugnir Console",
    description: "Operational command surface for geospatial monitoring and coordination.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
