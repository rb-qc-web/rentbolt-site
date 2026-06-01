import "./globals.css";
import { meta } from "@/lib/brand";

export const metadata = {
  title: {
    default: `${meta.siteName} — ${meta.tagline}`,
    template: `%s | ${meta.siteName}`,
  },
  description: meta.description,
  metadataBase: new URL(meta.url),
  openGraph: {
    title: `${meta.siteName} — ${meta.tagline}`,
    description: meta.description,
    url: meta.url,
    siteName: meta.siteName,
    locale: "en_CA",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: {
    canonical: meta.url,
    languages: { "en-CA": meta.url, "fr-CA": `${meta.url}/fr` },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
