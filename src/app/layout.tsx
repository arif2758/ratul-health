import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  description:
    "Your personal body health analysis and tracking partner. Track BMI, BMR, TDEE, and body fat with modern progress insights.",
  keywords: [
    "health analysis",
    "body tracking",
    "BMI calculator",
    "BMR calculator",
    "TDEE tracker",
    "health dashboard",
    "body fat calculator",
  ],
  authors: [{ name: "RatboD Team" }],
  creator: "RatboD",
  publisher: "RatboD",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RatboD - Health Analysis & Tracking",
    description:
      "Track your body transformation with RatboD's premium health dashboard.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    siteName: "RatboD",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "RatboD Health Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RatboD - Health Analysis & Tracking",
    description:
      "Track your body transformation with RatboD's premium health dashboard.",
    creator: "@ratbod",
    images: ["/logo.png"],
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
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/logo.png",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-clip`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "RatboD",
              url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
              description:
                "Body health analysis and tracking application for BMI, BMR, and TDEE.",
              applicationCategory: "HealthApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "RatboD",
              },
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              className: "backdrop-blur-xl bg-white/70 dark:bg-[#0F0F0F]/70 border border-black/5 dark:border-white/10 shadow-2xl rounded-2xl",
              style: {
                backdropFilter: "blur(16px)",
              }
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
