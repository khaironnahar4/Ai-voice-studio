import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/utils/ThemeProvider";
import { SmoothScrollProvider } from "@/utils/SmoothScrollProvider";
import { SessionProvider } from "@/components/providers/session-provider";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});
export const metadata: Metadata = {
  title: "Vocera — AI Text to Voice",
  description:
    "Transform your scripts into natural, expressive speech with AI-powered voices. Perfect for podcasts, videos, and more.",
  keywords: [
    "text to speech",
    "AI voice",
    "TTS",
    "voice synthesis",
    "audio generation",
  ],
  authors: [{ name: "Vocera" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${dm.variable} antialiased w-full min-w-dvw overflow-hidden`}
      >
        <SessionProvider>
          <SmoothScrollProvider>
            {/* <ThemeProvider> */}
            <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
            {children}
            <Toaster position="bottom-right" richColors />
            {/* </ThemeProvider> */}
          </SmoothScrollProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
