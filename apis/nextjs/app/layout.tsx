import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import Navbar from "@/components/ui/navbar"
import Footer from "@/components/ui/footer"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Made in Canada",
  description: "Discover amazing Canadian businesses and products",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Navbar />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  )
}



import './globals.css'