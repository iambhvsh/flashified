import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Website Downloader',
  description: 'Download complete websites with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
      <link rel="icon" href="https://em-content.zobj.net/source/apple/391/high-voltage_26a1.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
} 