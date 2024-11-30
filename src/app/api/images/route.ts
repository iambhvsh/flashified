import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import crypto from 'crypto';
import mime from 'mime-types';
import sanitizeFilename from 'sanitize-filename';
import pLimit from 'p-limit';

const CONFIG = {
  TIMEOUT: 10000,
  MAX_RETRIES: 2,
  CONCURRENT_REQUESTS: 10,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  MAX_IMAGES: 1000,
  IMAGE_SELECTORS: [
    'img[src]',
    'img[data-src]',
    'img[data-lazy-src]',
    'img[data-original]',
    'img[data-lazy]',
    'img[data-url]',
    'img[data-srcset]',
    'picture source[srcset]',
    'picture source[data-srcset]',
    '[style*="background-image"]',
    '[style*="background"]',
    '[data-bg]',
    '[data-background]',
    '[data-background-image]',
    'image'
  ],
  IMAGES_PER_PAGE: 20,
  MAX_CRAWL_DEPTH: 3,
  MAX_PAGES_TO_CRAWL: 30,
  PRELOAD_THRESHOLD: 0.5,
  DOMAIN_CRAWL_DEPTH: 5,
  MAX_DOMAIN_PAGES: 100,
  RETRY_DELAY: 500,
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  EXCLUDED_DOMAINS: [
    'google.com', 'facebook.com', 'doubleclick.net',
    'google-analytics.com', 'googleads.com'
  ],
  ADDITIONAL_SELECTORS: [
    'div[data-image-url]',
    'div[data-original]',
    'figure img',
    '.gallery img',
    '.slider img',
    'article img',
    '[class*="image"] img',
    '[class*="photo"] img',
    '[class*="picture"] img'
  ],
  STREAM_CHUNK_SIZE: 50
};

interface ImageInfo {
  url: string;
  filename: string;
  size?: number;
  dimensions?: { width: number; height: number };
  type?: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
}


interface CrawlState {
  visitedUrls: Set<string>;
  pendingUrls: string[];
  imageUrls: Set<string>;
  baseUrl: string;
  domain: string;
  isDomainCrawl: boolean;
}


async function fetchWithRetry(url: string, retries = CONFIG.MAX_RETRIES): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'image/*,*/*',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      maxRedirects: 5,
      validateStatus: (status) => status === 200
    });
    return response;
  } catch (error) {
    if (retries > 0 && error.response?.status !== 404) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    // Handle data URLs
    if (url.startsWith('data:')) return url;
    
    // Remove query parameters that might interfere with image detection
    url = url.split('?')[0];
    
    // Replace {width} and similar placeholders with reasonable defaults
    url = url.replace(/{width}/g, '800')
             .replace(/{height}/g, '800')
             .replace(/{size}/g, '800')
             .replace(/{quality}/g, '80')
             .replace(/%7Bwidth%7D/g, '800')  // URL encoded {width}
             .replace(/%7Bheight%7D/g, '800') // URL encoded {height}
             .replace(/%7Bsize%7D/g, '800')   // URL encoded {size}
             .replace(/%7Bquality%7D/g, '80'); // URL encoded {quality}
    
    // Handle relative URLs
    if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (url.startsWith('/')) {
      const baseUrlObj = new URL(baseUrl);
      url = `${baseUrlObj.protocol}//${baseUrlObj.host}${url}`;
    } else if (!url.startsWith('http')) {
      url = new URL(url, baseUrl).toString();
    }
    
    return url;
  } catch (e) {
    console.warn('URL normalization failed:', e);
    return null;
  }
}

async function fetchPage(url: string): Promise<string> {
  const headers = {
    'User-Agent': CONFIG.USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    const response = await axios.get(url, { 
      headers,
      timeout: CONFIG.TIMEOUT,
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching page:', error);
    throw error;
  }
}

async function extractImageUrls(html: string, baseUrl: string): Promise<Set<string>> {
  const $ = cheerio.load(html);
  const imageUrls = new Set<string>();

  const addUrl = (url: string) => {
    try {
      const normalizedUrl = normalizeUrl(url, baseUrl);
      if (normalizedUrl && isValidImageUrl(normalizedUrl)) {
        imageUrls.add(normalizedUrl);
      }
    } catch (e) {
      console.warn('Failed to process URL:', url, e);
    }
  };

  // Process all possible image sources
  CONFIG.IMAGE_SELECTORS.forEach(selector => {
    $(selector).each((_, element) => {
      const el = $(element);
      
      // Check all possible attributes that might contain image URLs
      const possibleAttributes = [
        'src', 'data-src', 'data-original', 'data-lazy',
        'data-url', 'href', 'data-full', 'data-image',
        'data-lazy-src', 'data-hi-res-src', 'data-high-res'
      ];

      possibleAttributes.forEach(attr => {
        const value = el.attr(attr);
        if (value) addUrl(value);
      });

      // Handle srcset
      const srcset = el.attr('srcset');
      if (srcset) {
        srcset.split(',').forEach(src => {
          const url = src.trim().split(' ')[0];
          if (url) addUrl(url);
        });
      }

      // Handle background images in style attribute
      const style = el.attr('style');
      if (style) {
        const matches = style.match(/url\(['"]?([^'"()]+)['"]?\)/g);
        matches?.forEach(match => {
          const url = match.replace(/url\(['"]?([^'"()]+)['"]?\)/, '$1');
          addUrl(url);
        });
      }
    });
  });

  return imageUrls;
}

function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const ext = urlObj.pathname.toLowerCase().split('.').pop() || '';
    return CONFIG.IMAGE_EXTENSIONS.includes(`.${ext}`);
  } catch {
    return false;
  }
}

function generateImageFilename(url: string, contentType: string): string {
  const urlObj = new URL(url);
  let filename = urlObj.pathname.split('/').pop() || 'image';
  
  // Remove query parameters and clean filename
  filename = filename.split('?')[0];
  filename = sanitizeFilename(filename);
  
  // Add extension if missing
  if (!filename.includes('.')) {
    const ext = mime.extension(contentType);
    if (ext) filename += `.${ext}`;
  }
  
  // Add hash to ensure uniqueness
  const hash = crypto.createHash('md5')
    .update(url)
    .digest('hex')
    .slice(0, 8);
  
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const ext = filename.slice(filename.lastIndexOf('.'));
  
  return `${nameWithoutExt}-${hash}${ext}`;
}

function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = new URL(url1).hostname;
    const domain2 = new URL(url2).hostname;
    return domain1 === domain2;
  } catch {
    return false;
  }
}


// Add this new function for streaming updates
async function* streamCrawlUpdates(initialUrl: string): AsyncGenerator<{
  newImages: ImageInfo[];
  crawlStatus: {
    pagesScanned: number;
    pagesRemaining: number;
    totalImages: number;
    maxImagesReached: boolean;
  };
}> {
  const state: CrawlState = {
    visitedUrls: new Set(),
    pendingUrls: [initialUrl],
    imageUrls: new Set(),
    baseUrl: initialUrl,
    domain: new URL(initialUrl).hostname,
    isDomainCrawl: true
  };

  const limit = pLimit(CONFIG.CONCURRENT_REQUESTS);
  let imageBuffer: string[] = [];

  try {
    while (state.pendingUrls.length > 0 && 
           state.imageUrls.size < CONFIG.MAX_IMAGES && 
           state.visitedUrls.size < CONFIG.MAX_PAGES_TO_CRAWL) {
      
      const currentUrl = state.pendingUrls.shift()!;
      if (state.visitedUrls.has(currentUrl)) continue;
      state.visitedUrls.add(currentUrl);

      try {
        const html = await fetchPage(currentUrl);
        const newImageUrls = await extractImageUrls(html, currentUrl);
        
        // Buffer images and yield in chunks
        for (const url of Array.from(newImageUrls)) {
          if (!state.imageUrls.has(url) && state.imageUrls.size < CONFIG.MAX_IMAGES) {
            state.imageUrls.add(url);
            imageBuffer.push(url);
            
            if (imageBuffer.length >= CONFIG.STREAM_CHUNK_SIZE) {
              yield {
                newImages: imageBuffer.map(url => ({
                  url,
                  filename: `image_${crypto.randomBytes(4).toString('hex')}.jpg`,
                  status: 'pending' as const,
                  type: mime.lookup(url) || 'image/*'
                })),
                crawlStatus: {
                  pagesScanned: state.visitedUrls.size,
                  pagesRemaining: state.pendingUrls.length,
                  totalImages: state.imageUrls.size,
                  maxImagesReached: state.imageUrls.size >= CONFIG.MAX_IMAGES
                }
              };
              imageBuffer = [];
            }
          }
        }

        // Process links with rate limiting
        const $ = cheerio.load(html);
        const links = $('a[href]').map((_, el) => $(el).attr('href')).get();
        
        await Promise.all(
          links.map(href => 
            limit(async () => {
              try {
                if (!href) return;
                const absoluteUrl = new URL(href, currentUrl).toString();
                if (isSameDomain(absoluteUrl, initialUrl) && 
                    !state.visitedUrls.has(absoluteUrl) &&
                    !state.pendingUrls.includes(absoluteUrl)) {
                  state.pendingUrls.push(absoluteUrl);
                }
              } catch (e) {
                // Ignore invalid URLs
              }
            })
          )
        );

      } catch (error) {
        console.warn(`Failed to process ${currentUrl}:`, error);
        continue;
      }

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Yield remaining buffered images
    if (imageBuffer.length > 0) {
      yield {
        newImages: imageBuffer.map(url => ({
          url,
          filename: `image_${crypto.randomBytes(4).toString('hex')}.jpg`,
          status: 'pending' as const,
          type: mime.lookup(url) || 'image/*'
        })),
        crawlStatus: {
          pagesScanned: state.visitedUrls.size,
          pagesRemaining: state.pendingUrls.length,
          totalImages: state.imageUrls.size,
          maxImagesReached: state.imageUrls.size >= CONFIG.MAX_IMAGES
        }
      };
    }

  } catch (error) {
    console.error('Stream error:', error);
    throw error;
  }
}

// Update the POST endpoint to handle aborted requests
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let streamClosed = false;

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const stream = new TransformStream({
      async transform(chunk, controller) {
        if (!streamClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      },
      flush() {
        streamClosed = true;
      }
    });

    const writer = stream.writable.getWriter();

    // Handle request cancellation
    request.signal.addEventListener('abort', () => {
      streamClosed = true;
      writer.close().catch(() => {});
    });

    // Start crawling in background
    (async () => {
      try {
        for await (const update of streamCrawlUpdates(url)) {
          if (streamClosed) break;
          await writer.write(update);
        }
      } catch (error) {
        console.error('Stream error:', error);
        if (!streamClosed) {
          try {
            await writer.write({
              error: 'Crawling failed',
              message: error.message
            });
          } catch (e) {
            // Ignore write errors after stream closed
          }
        }
      } finally {
        try {
          await writer.close();
        } catch (error) {
          // Ignore close errors
        }
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { urls } = await request.json();
    const limit = pLimit(CONFIG.CONCURRENT_REQUESTS);
    const zip = new JSZip();
    
    // Create a folder inside zip to prevent flat structure
    const imagesFolder = zip.folder('images');
    if (!imagesFolder) throw new Error('Failed to create images folder');

    const downloadPromises = urls.map((url: string) => 
      limit(async () => {
        try {
          const response = await fetchWithRetry(url);
          const contentType = response.headers['content-type'];
          const filename = generateImageFilename(url, contentType);
          
          // Store files in the images folder with sanitized names
          const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
          imagesFolder.file(safeFilename, response.data, {
            binary: true,
            createFolders: true,
            date: new Date()
          });
          
          return {
            url,
            filename: safeFilename,
            size: response.data.length,
            type: contentType,
            status: 'complete'
          };
        } catch (error) {
          console.error(`Failed to download: ${url}`, error);
          return { url, status: 'error' };
        }
      })
    );

    await Promise.all(downloadPromises);
    
    const zipContent = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }, // Reduced from 9 for better compatibility
      platform: 'UNIX' // Ensures consistent file handling
    });

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=downloaded_images.zip'
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to download images' },
      { status: 500 }
    );
  }
} 