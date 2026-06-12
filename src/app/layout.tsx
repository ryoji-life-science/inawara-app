import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "leaflet/dist/leaflet.css"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "稲藁進捗管理",
  description: "圃場ごとの稲藁処理の進捗を地図上で管理するアプリ",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  )
}
