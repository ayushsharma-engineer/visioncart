import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CustomerRouteGuard from "@/components/CustomerRouteGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VisionCart | Discover Your Style",
    template: "%s | VisionCart",
  },
  description:
    "Discover your style with VisionCart — AI-powered fashion recommendations, personalized outfits, and smarter shopping.",
  applicationName: "VisionCart",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CustomerRouteGuard>{children}</CustomerRouteGuard>
      </body>
    </html>
  );
}
