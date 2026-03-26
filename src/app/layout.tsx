import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "RatboD - Health Analysis & Tracking",
    template: "%s | RatboD",
  },
  description: "Your personal body health analysis and tracking partner. Track BMI, BMR, TDEE, and body fat with modern progress insights.",
  keywords: ["health analysis", "body tracking", "BMI calculator", "BMR calculator", "TDEE tracker", "health dashboard", "body fat calculator"],
  authors: [{ name: "RatboD Team" }],
  creator: "RatboD",
  publisher: "RatboD",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ratbod.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RatboD - Health Analysis & Tracking",
    description: "Track your body transformation with RatboD's premium health dashboard.",
    url: "https://ratbod.vercel.app",
    siteName: "RatboD",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
        alt: "RatboD Health Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RatboD - Health Analysis & Tracking",
    description: "Track your body transformation with RatboD's premium health dashboard.",
    creator: "@ratbod",
    images: ["/apple-touch-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/mask-icon.svg",
        color: "#32CD32",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RatboD",
  },
  category: "Health",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-clip`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RatboD",
              "url": "https://ratbod.vercel.app",
              "description": "Body health analysis and tracking application for BMI, BMR, and TDEE.",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "RatboD"
              }
            }),
          }}
        />
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
