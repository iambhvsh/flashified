'use client'

import React, { useState, useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiSearch, FiX, FiInfo, FiGithub, FiGlobe, FiCheck, FiSettings } from 'react-icons/fi'
import LoadingSpinner from './LoadingSpinner'
import Image from 'next/image'
import Link from 'next/link'

interface ImageInfo {
  url: string;
  filename?: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  versions?: {
    thumbnail: string;
    preview: string;
    original: string;
  };
}

interface CategoryOption {
  id: string;
  label: string;
  description: string;
  default: boolean;
}

const IMAGE_CATEGORIES: CategoryOption[] = [
  {
    id: 'default',
    label: 'All Images',
    description: 'Search all image types and formats',
    default: true
  },
  {
    id: 'photos',
    label: 'Photos & Images',
    description: 'Regular photos and images (JPG, PNG, WebP)',
    default: false
  },
  {
    id: 'icons',
    label: 'Icons & Favicons',
    description: 'Website icons and favicons',
    default: false
  },
  {
    id: 'vectors',
    label: 'Vector Graphics',
    description: 'SVG and vector images',
    default: false
  },
  {
    id: 'thumbnails',
    label: 'Thumbnails',
    description: 'Small preview images',
    default: true
  },
  {
    id: 'banners',
    label: 'Banners & Headers',
    description: 'Large banner images and headers',
    default: true
  },
  {
    id: 'social',
    label: 'Social Media Images',
    description: 'Images for social media sharing',
    default: false
  }
];

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

const Lightbox = ({ image, onClose }: { image: ImageInfo; onClose: () => void }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = document.createElement('img');
    img.src = image.versions.original;
    img.onload = () => setLoading(false);
  }, [image]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50">
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="large" />
          </div>
        )}
        
        <img
          src={loading ? image.versions.preview : image.versions.original}
          alt={image.filename || ''}
          className={`max-h-[90vh] max-w-[90vw] object-contain transition-opacity duration-300
            ${loading ? 'opacity-50' : 'opacity-100'}`}
        />

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => downloadSingleImage(image)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiDownload className="text-white text-xl" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX className="text-white text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ImageGrid = memo(({ images }: { images: ImageInfo[] }) => {
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.url}
            className="aspect-square bg-gray-900/50 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={`data:image/webp;base64,${image.versions.thumbnail}`}
              alt={image.filename || ''}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <Lightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
});

ImageGrid.displayName = 'ImageGrid';

export default function ImageDownloader() {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);
  const [stopCrawling, setStopCrawling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('selectedCategories');
        return saved ? JSON.parse(saved) : ['default'];
      } catch {
        return ['default'];
      }
    }
    return ['default'];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    }
  }, [selectedCategories]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleInfoClick = () => {
    setIsModalOpen(true);
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addUniqueImages = (newImages: ImageInfo[]) => {
    setImages(prevImages => {
      const uniqueImages = newImages.filter(newImg => 
        !prevImages.some(existingImg => 
          existingImg.url === newImg.url || 
          (existingImg.versions?.thumbnail === newImg.versions?.thumbnail)
        )
      );
      return [...prevImages, ...uniqueImages].slice(0, 1000); // Keep max 1000 images
    });
  };

  const handleCategoryToggle = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    
    setSelectedCategories(prev => {
      let newCategories;
      if (categoryId === 'default') {
        newCategories = ['default'];
      } else {
        const withoutDefault = prev.filter(id => id !== 'default');
        if (prev.includes(categoryId)) {
          newCategories = withoutDefault.filter(id => id !== categoryId);
        } else {
          newCategories = [...withoutDefault, categoryId];
        }
        if (newCategories.length === 0) {
          newCategories = ['default'];
        }
      }
      
      // Save to localStorage synchronously
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedCategories', JSON.stringify(newCategories));
      }
      
      return newCategories;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setImages([]);
    setIsCrawling(true);
    setStopCrawling(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const decoder = new TextDecoder();

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: url.trim(),
          categories: selectedCategories.map(cat => cat.toUpperCase())
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to initialize stream reader');

      let buffer = '';
      let foundImages = false;

      while (!stopCrawling) {
        try {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.newImages?.length > 0) {
                  foundImages = true;
                  addUniqueImages(data.newImages);
                }
                if (data.crawlStatus) {
                  console.log('Crawl status:', data.crawlStatus);
                }
              } catch (e) {
                console.warn('Failed to parse update:', e);
              }
            }
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            break;
          }
          throw error;
        }
      }

      if (!foundImages) {
        setError('No images found on this website');
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to fetch images');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setIsCrawling(false);
    }
  };

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStopCrawling(true);
      setIsCrawling(false);
      setLoading(false);
    }
  };

  // Add this function to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const dropdown = document.querySelector('.settings-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="space-y-6">
      <div className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:h-14 gap-2 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
              <div className="flex items-center gap-2">
                <Image src="https://em-content.zobj.net/source/apple/391/high-voltage_26a1.png" alt="Flashified" width={20} height={20} />
                <h1 className="text-lg font-medium text-white/90">Flashified</h1>
              </div>
              <motion.button 
                className="sm:hidden p-2 text-white/70 hover:text-white/90 transition-colors"
                onClick={handleInfoClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiInfo className="text-lg" />
              </motion.button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <form onSubmit={handleSubmit} className="relative w-full sm:w-96">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 text-white placeholder-gray-500 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
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
                  <div className="relative">
                    <motion.button 
                      type="button"
                      className="p-2 text-white/70 hover:text-white/90 transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiSettings className="text-lg" />
                    </motion.button>
                    
                    {isDropdownOpen && (
                      <div className="settings-dropdown absolute right-0 mt-2 w-64 bg-gray-900/95 border border-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm z-50">
                        <div className="p-2">
                          <div className="text-sm text-gray-400 px-3 py-2 border-b border-gray-800/50">
                            Image Categories
                          </div>
                          <div className="mt-1">
                            {IMAGE_CATEGORIES.map(category => (
                              <button
                                key={category.id}
                                onClick={(e) => handleCategoryToggle(e, category.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left text-sm transition-colors rounded-md"
                              >
                                <div className="w-4 h-4 flex-shrink-0">
                                  {selectedCategories.includes(category.id) && (
                                    <FiCheck className="text-primary-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-gray-200">{category.label}</div>
                                  <div className="text-xs text-gray-500">{category.description}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </form>
              
              <motion.button 
                className="hidden sm:block p-2 text-white/70 hover:text-white/90 transition-colors"
                onClick={handleInfoClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiInfo className="text-lg" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed top-0 left-0 right-0 bottom-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center overflow-y-auto py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
          >
            <div className="w-full max-w-md mx-4 my-auto">
              <motion.div 
                className="bg-gray-900/95 rounded-xl p-8 w-full shadow-2xl border border-gray-800/50 max-w-2xl"
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-500/10 rounded-xl">
                      <Image 
                        src="https://em-content.zobj.net/source/apple/391/high-voltage_26a1.png" 
                        alt="Flashified" 
                        width={28} 
                        height={28}
                        className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-white">About Flashified</h2>
                  </div>
                  <button 
                    onClick={handleModalClose}
                    className="p-2.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>
                <div className="text-gray-300 space-y-8">
                  <ul className="grid grid-cols-2 gap-5 text-sm list-none">
                    {[
                      'Download images from any website',
                      'Automatically detect high-quality images',
                      'Support for lazy-loaded images',
                      'Handle dynamic content',
                      'Process multiple pages',
                      'Download in bulk with ZIP'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-400 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                        <FiCheck className="text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-5 border border-yellow-500/10">
                    <p className="text-sm text-yellow-200/90 flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <span className="leading-relaxed">Use this tool responsibly and ensure you have the right to download images.</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-5 pt-3 text-center">
                    <p className="text-sm text-gray-400">
                      Made with <span className="text-red-500 animate-pulse">❤️</span> by{' '}
                      <Link 
                        href="https://iambhvsh.vercel.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-500 hover:text-primary-400 transition-colors font-semibold"
                      >
                        Bhavesh Patil
                      </Link>
                    </p>
                    <div className="flex gap-4">
                      <Link 
                        href="https://github.com/iambhvsh/flashified" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2.5 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-lg hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <FiGithub className="text-lg" />
                        GitHub
                      </Link>
                      <Link 
                        href="https://iambhvsh.vercel.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-gray-300 hover:text-white transition-all flex items-center gap-2.5 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-lg hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <FiGlobe className="text-lg" />
                        Portfolio
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && images.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
        >
          {error ? (
            <div className="text-red-500 space-y-2">
              <FiX className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">{error}</p>
              <p className="text-sm text-gray-400">Please try a different URL or check your connection.</p>
            </div>
          ) : (
            <div className="text-gray-400 space-y-3 text-center mt-[150px] px-2">
              <Image src="https://em-content.zobj.net/source/apple/391/high-voltage_26a1.png" alt="Flashified" width={40} height={40} className="mx-auto mb-4 text-primary-500" />
              <h2 className="text-2xl font-semibold text-white">Flashified</h2>
              <div className="space-y-2 mt-2">
                <p className="text-lg mb-5">Simply paste a URL to extract images from websites, blogs, galleries and more</p>
                <ul className="text-sm space-y-1.5 max-w-md mx-auto">
                  <li className="flex items-center justify-center gap-1.5">
                    <FiCheck className="text-green-500 flex-shrink-0" />
                    <span>Automatically detects and downloads all images</span>
                  </li>
                  <li className="flex items-center justify-center gap-1.5">
                    <FiCheck className="text-green-500 flex-shrink-0" />
                    <span>Supports most major websites and image formats</span>
                  </li>
                  <li className="flex items-center justify-center gap-1.5">
                    <FiInfo className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Some sites may fail.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {images.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="pt-24 sm:pt-20 pb-24">
            <ImageGrid images={images} />
          </div>
        </div>
      )}

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
    </div>
  );
} 