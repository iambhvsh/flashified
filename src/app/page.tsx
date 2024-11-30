import ImageDownloader from '../components/ImageDownloader'
import Header from '../components/Header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://flashified.vercel.app'),
  title: 'Flashified - Fast Bulk Image Downloader',
  description: 'Download images in bulk from any website or search the web for images. Fast, free, and easy to use.',
  keywords: 'bulk image downloader, image crawler, web scraper, image search, download images',
  authors: [{ name: 'Bhavesh Patil' }],
  openGraph: {
    title: 'Flashified - Fast Bulk Image Downloader',
    description: 'Download images in bulk from any website or search the web for images. Fast, free, and easy to use.',
    type: 'website',
    url: '/',
    siteName: 'Flashified',
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Header />
        <ImageDownloader />
      </div>
    </main>
  )
} 