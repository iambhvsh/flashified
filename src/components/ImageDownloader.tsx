'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiSearch, FiX, FiZap, FiInfo } from 'react-icons/fi'
import LoadingSpinner from './LoadingSpinner'
import Image from 'next/image'

interface ImageInfo {
  url: string;
  filename?: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
}

const ImageWithFallback = ({ src, alt = '', ...props }) => {
  const [error, setError] = useState(false);
  const fallbackUrl = `https://placehold.co/600x400/1f2937/38bdf8?text=Image+Not+Found`;

  if (error) {
    return (
      <Image
        src={fallbackUrl}
        alt="Fallback"
        className={`object-cover ${props.className || ''}`}
        {...props}
        width={props.fill ? undefined : (props.width || 300)}
        height={props.fill ? undefined : (props.height || 300)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={`object-cover ${props.className || ''}`}
      {...props}
      width={props.fill ? undefined : (props.width || 300)}
      height={props.fill ? undefined : (props.height || 300)}
      quality={props.isThumb ? 60 : 100}
      onError={() => setError(true)}
      unoptimized={!props.isThumb}
    />
  );
};

const downloadSingleImage = async (image: ImageInfo) => {
  try {
    const response = await fetch('/api/images/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: image.url,
        quality: 'original'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = image.url.split('.').pop()?.match(/^(jpg|jpeg|png|gif|webp)$/i)?.[0] || 'jpg';
    a.download = `${image.filename || `image_${Date.now()}`}.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    console.error('Failed to download image:', err);
  }
};

const downloadAllImages = async (images: ImageInfo[]) => {
  try {
    const response = await fetch('/api/images', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: images.map(img => img.url) })
    });

    if (!response.ok) throw new Error('Failed to download images');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downloaded_images.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (err) {
    console.error('Failed to download zip:', err);
  }
};

export default function ImageDownloader() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageInfo[]>([])
  const [isCrawling, setIsCrawling] = useState(false)
  const [stopCrawling, setStopCrawling] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setImages([]);
    setIsCrawling(true);
    setStopCrawling(false);

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to fetch images');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader && !stopCrawling) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setImages(prev => {
                const newImages = [...prev, ...data.newImages];
                return newImages.slice(0, 1000);
              });
              
              if (data.crawlStatus.maxImagesReached) {
                setStopCrawling(true);
                break;
              }
            } catch (e) {
              console.warn('Failed to parse update:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error('Crawling stopped');
      } else {
        console.error('Failed to fetch images:', err);
      }
    } finally {
      setLoading(false);
      setIsCrawling(false);
      setStopCrawling(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStopCrawling(true);
      setIsCrawling(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:h-14 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
              <div className="flex items-center gap-2">
                <FiZap className="text-xl text-primary-500" />
                <h1 className="text-lg font-medium text-white/90">Flashified</h1>
              </div>
              <motion.button 
                className="sm:hidden p-2 text-white/70 hover:text-white/90 transition-colors"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiInfo className="text-lg" />
              </motion.button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <form onSubmit={handleSubmit} className="relative w-full sm:w-96">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL..."
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 text-white placeholder-gray-500 text-sm"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  {isCrawling && (
                    <button
                      type="button"
                      onClick={handleStop}
                      className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="p-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <LoadingSpinner size="small" /> : <FiSearch className="text-lg" />}
                  </button>
                </div>
              </form>
              <motion.button 
                className="hidden sm:block p-2 text-white/70 hover:text-white/90 transition-colors"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiInfo className="text-lg" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="pt-24 sm:pt-20 pb-24">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="aspect-square relative rounded-lg overflow-hidden bg-gray-900">
                <ImageWithFallback
                  src={image.url}
                  alt={image.filename || `Image ${index + 1}`}
                  className="object-cover hover:scale-105 transition-transform duration-200"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  isThumb={true}
                  onClick={() => setSelectedImage(image)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 p-4 z-50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex justify-between items-center">
            <span className="text-white/70">
              {images.length} images found
            </span>
            <button
              onClick={() => downloadAllImages(images)}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <FiDownload />
              Download All
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gray-900 rounded-lg p-8 w-full max-w-md mx-auto shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <motion.button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white/90"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiX className="text-xl" />
              </motion.button>
              
              <h2 className="text-xl font-medium text-white mb-4">About Flashified</h2>
              <p className="text-white/70 mb-4">
                A powerful bulk image downloader and search tool created by Bhavesh Patil.
              </p>
              <div className="flex gap-4">
                <motion.a 
                  href="https://github.com/iambhvsh/flashified" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  GitHub
                </motion.a>
                <motion.a 
                  href="https://iambhvsh.vercel.app" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Portfolio
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex flex-col items-center justify-center gap-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.filename || 'Full size image'}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <motion.button
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white/70 hover:text-white"
                  onClick={() => setSelectedImage(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX className="text-xl" />
                </motion.button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSingleImage(selectedImage);
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <FiDownload />
                Download Original
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 