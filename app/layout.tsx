import type React from "react"
import type { Metadata } from "next"
import { Space_Mono, Fira_Code, JetBrains_Mono, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"

// A technical sans-serif font for body text
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
})

// A monospace font for code-like elements and headers
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
})

// A technical monospace font for signatures and verification
const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
})

// A clean monospace font for input and interactive elements
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "incognito.ai - Private AI Assistant",
  description: "Chat with AI securely and privately without compromising your data",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${spaceMono.variable} ${firaCode.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  )
}

