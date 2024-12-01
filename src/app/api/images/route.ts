import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import mime from 'mime-types';
import sanitizeFilename from 'sanitize-filename';
import pLimit from 'p-limit';
import crypto from 'crypto';

const CONFIG = {
  ERROR_HANDLING: {
    MAX_RETRIES: 2,
    TIMEOUT_MS: 10000,
    RETRY_DELAY: 500,
    BACKOFF_FACTOR: 1.5,
    ERROR_CODES: {
      RETRY: [408, 429, 500, 502, 503, 504],
      SKIP: [401, 403, 404, 410]
    }
  },
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  CONCURRENT_REQUESTS: 5,
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  MAX_IMAGES: 10000,
  IMAGE_SELECTORS: [
    'img[src]', 'img[data-src]', 'img[srcset]', 'source[srcset]',
    '[style*="background-image"]', '[style*="background"]', '[data-background]', '[data-bg]',
    '[loading="lazy"]', '[data-lazy]', '[data-srcset]', '[data-lazy-src]',
    'picture source[srcset]', 'picture img', 'figure img', '.image img', '.img img',
    'article img', 'main img', '.content img', '.post-content img',
    'meta[property="og:image"]', 'meta[name="twitter:image"]', 'link[rel="icon"]', 'link[rel="apple-touch-icon"]',
    '.instagram-media img',
    '.twitter-tweet img',
    '.tiktok-embed img',
    '.pinterest-pin img',
    '.medium-zoom-image',
    '.gatsby-resp-image-image',
    '.notion-image-block img',
    '.hashnode-image-wrapper img',
    '.dev-to-image img',
    '.product-image img',
    '.woocommerce-product-gallery__image img',
    '.shopify-section img',
    '.portfolio-item img',
    '.gallery-item img',
    '.masonry-grid img',
    '.lightbox-image',
    '[data-next-image]',
    '[data-gatsby-image]',
    '[data-nuxt-img]',
    '[data-astro-img]',
    '[loading="eager"]',
    '[fetchpriority="high"]',
    '[data-ll-status="loaded"]',
    '.lazyloaded',
    '.replicate-output img', '.huggingface-output img',
    '.stability-output img', '.openai-image',
    '.midjourney-result img', '.dall-e-output',
    '.nft-image', '.opensea-asset img',
    '.rarible-item img', '.foundation-item img',
    '.superrare-artwork img', '.nifty-image',
    '.youtube-thumbnail', '.vimeo-thumbnail',
    '.twitch-thumbnail', '.tiktok-thumbnail',
    '.loom-thumbnail', '.wistia-thumbnail',
    '.figma-export', '.sketch-export',
    '.adobe-xd-asset', '.invision-export',
    '.zeplin-asset', '.abstract-asset',
    '.docusaurus-image', '.gitbook-image',
    '.readme-asset', '.notion-asset',
    '.confluence-image', '.storybook-asset',
    '.contentful-asset', '.sanity-asset',
    '.strapi-media', '.prismic-image',
    '.payload-media', '.tina-asset',
    '[data-gcloud-storage]', '[data-s3-image]',
    '[data-azure-blob]', '[data-cloudflare-r2]',
    '[data-backblaze-b2]', '[data-wasabi-s3]',
    '.discord-embed img', '.slack-image',
    '.telegram-image', '.whatsapp-image',
    '.reddit-media img', '.mastodon-media',
    '.linkedin-image', '.facebook-image',
    '.udemy-asset img', '.coursera-image',
    '.edx-asset', '.khan-academy-image',
    '.pluralsight-image', '.egghead-lesson-image',
    '.frontendmasters-thumb', '.codecademy-image',
    '.behance-project img', '.dribbble-shot',
    '.artstation-asset', '.deviantart-image',
    '.awwwards-site img', '.pinterest-board img',
    '.shutterstock-image', '.stock-photo',
    '.github-asset', '.gitlab-image',
    '.bitbucket-image', '.npm-package-image',
    '.docker-hub-image', '.kubernetes-diagram',
    '.aws-diagram img', '.azure-architecture',
    '.wordpress-block img', '.medium-zoom',
    '.substack-image', '.ghost-image',
    '.webflow-image', '.wix-image',
    '.squarespace-gallery', '.shopify-product',
    '[data-swiper-slide] img', '[data-lightbox]',
    '[data-fancybox]', '[data-photoswipe]',
    '.masonry-item img', '.infinite-scroll-item img',
    '.lazy-load-image', '.progressive-image'
  ],
  CDN_PATTERNS: [
    /\.(cloudinary|imgix|githubusercontent|cdninstagram)\.com$/i,
    /\.(wp|squarespace|shopify)\.com$/i,
    /\.(akamaized|cloudfront|fastly)\.net$/i,
    /\.(googleapis|gstatic)\.com$/i,
    /\.(amazonaws|digitaloceanspaces|b-cdn)\.com$/i,
    /\.(sirv|imagekit|imgix|optimole)\.com$/i,
    /\.(photobucket|imageshack|postimg)\.org$/i,
    /\.(staticflickr|media-amazon|media-pinterest)\.com$/i,
    /\.vercel\.app$/i,
    /\.netlify\.app$/i,
    /\.herokuapp\.com$/i,
    /\.surge\.sh$/i,
    /\.pages\.dev$/i,
    /\.web\.app$/i,
    /\.firebase\.app$/i,
    /\.azurestaticapps\.net$/i,
    /\.github\.io$/i,
    /\.(wixmp|wix|weebly|webflow)\.com$/i,
    /\.(hubspot|hubspotusercontent)\.com$/i,
    /\.(zendesk|zdassets)\.com$/i,
    /\.(typeform|typekit)\.net$/i,
    /\.(medium|substack|ghost)\.com$/i,
    /\.(notion|notion\.so)$/i,
    /\.(storyblok|contentstack|prismic)\.com$/i,
    /\.(sanity|sanity\.io)$/i,
    /\.(webnode|webnodessl)\.com$/i,
    /\.(contentstack|strapi|prismic|sanity)\.io$/i,
    /\.(webflow|framer|storyblok)\.com$/i,
    /\.(imgbb|imgur|giphy)\.com$/i,
    /\.(backblazeb2|wasabisys|linode)\.com$/i,
    /\.(gumlet|imagekit|uploadcare)\.com$/i,
    /\.(builder|payload|directus)\.io$/i,
    /\.(keystonejs|tina|forestry)\.io$/i,
    /\.(ghost|hashnode|devto)\.io$/i,
    /\.(replicate|huggingface|stability|openai)\.com$/i,
    /\.(anthropic|cohere|deepmind)\.com$/i,
    /\.(opensea|rarible|foundation|superrare)\.io$/i,
    /\.(nifty|mintable|objkt|hicetnunc)\.com$/i,
    /\.(figma|sketch|adobe|invision|zeplin)\.com$/i,
    /\.(abstract|miro|whimsical|canva)\.com$/i,
    /\.(gitbook|readme|notion|confluence)\.com$/i,
    /\.(storybook|docusaurus|mkdocs|vuepress)\.io$/i,
    /\.(r2|workers|pages)\.dev$/i,
    /\.(b2|wasabi|linode|vultr|ovh)\.com$/i,
    /\.(udemy|coursera|edx|pluralsight)\.com$/i,
    /\.(egghead|frontendmasters|codecademy)\.io$/i,
    /\.(behance|dribbble|artstation|deviantart)\.net$/i,
    /\.(awwwards|csswinner|cssdesignawards)\.com$/i,
    /\.(github|gitlab|bitbucket|npmjs)\.com$/i,
    /\.(docker|kubernetes|terraform)\.io$/i,
    /\.(atlassian|jira|confluence)\.com$/i,
    /\.(salesforce|zendesk|hubspot)\.com$/i,
    /\.(vimeo|dailymotion|ted)\.com$/i,
    /\.(spotify|soundcloud|mixcloud)\.com$/i
  ],
  IMAGE_QUALITY: {
    thumbnail: { width: 150, height: 150, quality: 60, format: 'webp' },
    preview: { width: 800, height: 800, quality: 80, format: 'webp' },
    original: { quality: 100 }
  },
  SUPPORTED_FORMATS: {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/gif': true,
    'image/avif': true,
    'image/heic': true,
    'image/heif': true,
    'image/tiff': true,
    'image/bmp': true
  },
  MAX_PAGES_TO_CRAWL: 100,
  MAX_CRAWL_DEPTH: 5,
  IMAGES_PER_PAGE: 10,
  ADDITIONAL_SELECTORS: [
    'img[class*="image"]',
    'img[class*="photo"]',
    'img[class*="picture"]',
    'img[class*="gallery"]',
    '[class*="image-container"] img',
    '[class*="img-container"] img',
    'img[loading="lazy"]'
  ],
  IMAGE_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', 
    '.avif', '.heic', '.heif', '.tiff', '.bmp'
  ],
  RETRY_DELAY: 1000,
  DYNAMIC_LOADING_ATTRIBUTES: [
    'data-src',
    'data-srcset',
    'data-lazy-src',
    'data-original',
    'data-load-src',
    'data-async-src',
    'loading="lazy"',
    'decoding="async"',
    'fetchpriority="high"'
  ],
  NEXT_IMAGE_PATTERNS: [
    /\/_next\/image\?url=/i,
    /\/_next\/static\/media\//i,
    /\/_next\/static\/images\//i
  ],
  URL_TRANSFORMS: [
    {
      match: /\/_next\/image\?url=(.*?)&/i,
      transform: (url: string) => decodeURIComponent(url.match(/url=(.*?)&/i)?.[1] || url)
    }
  ],
  IMAGE_HOSTING_PATTERNS: [
    /\.(cdn|img|image|assets|static|media|uploads)\./i,
    /\.(cloudinary|imgix|fastly|akamai)\./i,
    /\.(wp|wordpress|squarespace|shopify|contentful)\./i,
    /\.(githubusercontent|cloudfront|amazonaws)\./i
  ],
  HOSTING_PLATFORMS: {
    VERCEL: {
      patterns: [/\.vercel\.app$/, /\.now\.sh$/, /\.vercel\.dev$/],
      imagePatterns: [
        '/_next/image',
        '/_next/static/media',
        '/_next/static/images',
        '/assets',
        '/public'
      ]
    },
    NETLIFY: {
      patterns: [/\.netlify\.app$/, /\.netlify\.com$/],
      imagePatterns: [
        '/images',
        '/.netlify/images',
        '/img',
        '/assets'
      ]
    },
    GITHUB_PAGES: {
      patterns: [/\.github\.io$/],
      imagePatterns: [
        '/assets',
        '/images',
        '/img',
        '/static'
      ]
    },
    CLOUDFLARE: {
      patterns: [/\.pages\.dev$/, /\.workers\.dev$/],
      imagePatterns: [
        '/cdn-cgi/image',
        '/assets',
        '/images'
      ]
    },
    FIREBASE: {
      patterns: [/\.web\.app$/, /\.firebaseapp\.com$/],
      imagePatterns: [
        '/assets',
        '/images',
        '/storage'
      ]
    },
    WIX: {
      patterns: [/\.wixsite\.com$/, /\.wix\.com$/],
      imagePatterns: [
        '/media/',
        '/static/',
        '/images/',
        '/uploads/'
      ]
    },
    WEBFLOW: {
      patterns: [/\.webflow\.io$/, /\.webflow\.com$/],
      imagePatterns: [
        '/assets/',
        '/uploads/',
        '/images/'
      ]
    },
    NOTION: {
      patterns: [/\.notion\.site$/, /\.notion\.so$/],
      imagePatterns: [
        '/images/',
        '/secure.notion-static.com/',
        '/prod-files-secure'
      ]
    },
    MEDIUM: {
      patterns: [/\.medium\.com$/],
      imagePatterns: [
        '/max/',
        '/fit/',
        '/progressive/'
      ]
    },
    SUBSTACK: {
      patterns: [/\.substack\.com$/],
      imagePatterns: [
        '/media/',
        '/post/',
        '/images/'
      ]
    }
  },
  FRAMEWORK_PATTERNS: {
    NEXT: [
      'img[src*="/_next/"]',
      'img[srcset*="/_next/"]',
      '[style*="/_next/"]',
      'span[style*="/_next/"]'
    ],
    GATSBY: [
      'img[src*="/static/"]',
      '.gatsby-image-wrapper img',
      '[data-gatsby-image-wrapper] img'
    ],
    WORDPRESS: [
      'img[src*="/wp-content/"]',
      'img[src*="/uploads/"]',
      '.wp-block-image img'
    ],
    SHOPIFY: [
      'img[src*=".shopify.com"]',
      'img[src*="/cdn/"]',
      '.shopify-section img'
    ]
  },
  COMMON_IMAGE_PATHS: [
    '/images',
    '/img',
    '/assets',
    '/uploads',
    '/media',
    '/static',
    '/public',
    '/content',
    '/resources',
    '/files',
    '/attachments',
    '/gallery',
    '/photos',
    '/pictures',
    '/graphics',
    '/icons',
    '/logos',
    '/banners',
    '/backgrounds'
  ],
  IMAGE_DOMAINS: [
    'cloudinary.com',
    'imgix.net',
    'amazonaws.com',
    'googleapis.com',
    'cloudfront.net',
    'akamaized.net',
    'fastly.net',
    'cdn.shopify.com',
    'wp.com',
    'squarespace.com',
    'githubusercontent.com',
    'staticflickr.com',
    'twimg.com',
    'unsplash.com',
    'pexels.com',
    'pixabay.com',
    'images.pexels.com',
    'images.unsplash.com',
    'img.freepik.com',
    'media.istockphoto.com',
    'cdn.pixabay.com',
    'images.shutterstock.com',
    'res.cloudinary.com',
    'images.contentful.com',
    'cdn.dribbble.com',
    'cdn.behance.net',
    'images.squarespace-cdn.com',
    'cdn.shopify.com',
    'cdn.wix.com',
    'images.prismic.io',
    'cdn.sanity.io',
    'images.ctfassets.net',
    'cdn.builder.io',
    'assets.vercel.com',
    'cdn.hashnode.com',
    'dev-to-uploads.s3.amazonaws.com',
    'replicate.delivery',
    'huggingface.co',
    'stability.ai',
    'openai-labs.com',
    'opensea.io',
    'rarible.com',
    'foundation.app',
    'superrare.com',
    'figma.com',
    'sketch.cloud',
    'adobe.io',
    'invisionapp.com',
    'gitbook.io',
    'readme.io',
    'storybook.js.org',
    'r2.dev',
    'b2.cloud',
    'wasabisys.com',
    'coursera-course-photos.s3.amazonaws.com',
    'udemy-images.udemy.com',
    'static.egghead.io',
    'static.frontendmasters.com',
    'pluralsight.imgix.net',
    'raw.githubusercontent.com',
    'gitlab.com',
    'bitbucket.org',
    'registry.npmjs.org',
    'hub.docker.com',
    'atlassian.net',
    'salesforce.com',
    'zendesk.com',
    'hubspot.net',
    'i.vimeocdn.com',
    'static.dailymotion.com',
    'ted.com',
    'i.scdn.co',
    'soundcloud.com'
  ],
  validateImageResponse: (response: any) => {
    try {
      const contentType = response.headers?.['content-type']?.toLowerCase();
      return contentType?.includes('image/') || 
             contentType?.includes('application/octet-stream') ||
             isValidImageUrl(response.config?.url);
    } catch (error) {
      return false;
    }
  },
  FRAMEWORK_PATHS: [
    '/static/',
    '/media/',
    '/uploads/',
    '/wp-content/',
    '/assets/',
    '/images/',
    '/img/',
    '/files/',
    '/content/',
    '/resources/',
    '/_next/',
    '/cdn/',
    '/storage/'
  ],
  FRAMEWORK_SUPPORT: {
    WORDPRESS: ['.wp-block-image img', '.wp-post-image', '.attachment-large'],
    SHOPIFY: ['.product__image', '.product-single__image', '.product-featured-img'],
    WOOCOMMERCE: ['.woocommerce-product-gallery__image', '.attachment-shop_single'],
    SQUARESPACE: ['.sqs-image', '.thumb-image', '.summary-thumbnail-image'],
    WEBFLOW: ['.w-image', '.w-background-video', '.w-lightbox'],
    CONTENTFUL: ['[data-contentful-image]', '.contentful-image'],
    DRUPAL: ['.field-type-image img', '.image-style-large'],
    GHOST: ['.kg-image-card img', '.kg-gallery-image img'],
    NEXTJS: [
      'span[style*="background-image"]',
      '[data-nimg]',
      '.next-image',
      'img[srcset*="/_next/image"]',
      'img[src*="/_next/"]',
      '[style*="_next/image"]'
    ],
    GATSBY: ['.gatsby-image-wrapper img', '[data-gatsby-image-wrapper] img'],
    VERCEL: ['img[src*=".vercel.app"]', 'img[src*="/_vercel/image"]'],
    REACT: ['[class*="react-image"]', '[data-react-img]'],
    VUE: ['[class*="v-img"]', '[class*="vue-image"]'],
    ANGULAR: ['[class*="ng-image"]', '[data-ng-src]'],
    SVELTE: ['[class*="svelte-img"]', 'img[data-svelte-img]'],
    REMIX: ['img[src*="/_assets/"]', 'img[src*="/build/_assets/"]'],
    ASTRO: ['img[src*="/_astro/"]', 'img[src*="/assets/"]'],
    NUXT: ['img[src*="/_nuxt/"]', '[class*="nuxt-img"]'],
    DIRECTUS: ['.directus-image', '[data-directus-image]'],
    STRAPI: ['.strapi-image', '[data-strapi-media]', '[data-strapi-image]', '.strapi-image-wrapper img'],
    REPLICATE: ['.replicate-output', '[data-replicate-output]'],
    HUGGINGFACE: ['.huggingface-output', '[data-hf-output]'],
    STABILITY: ['.stability-output', '[data-stability-output]'],
    OPENAI: ['.openai-image', '[data-openai-image]'],
    WEB3: ['.web3-image', '[data-web3-image]'],
    NFT: ['.nft-image', '[data-nft-asset]'],
    FIGMA: ['.figma-embed img', '[data-figma-asset]'],
    SKETCH: ['.sketch-embed img', '[data-sketch-asset]'],
    DOCUSAURUS: ['.docusaurus-image', '[data-docusaurus-image]'],
    GITBOOK: ['.gitbook-image', '[data-gitbook-asset]'],
    STORYBOOK: ['.storybook-image', '[data-storybook-asset]'],
    CLOUDFLARE: ['.cloudflare-image', '[data-r2-image]'],
    BACKBLAZE: ['.b2-image', '[data-b2-asset]'],
    UDEMY: ['.udemy-video-player img', '.course-image'],
    COURSERA: ['.coursera-course-image', '.specialization-logo'],
    PLURALSIGHT: ['.video-poster', '.course-image'],
    EGGHEAD: ['.lesson-image', '.collection-image'],
    GITHUB: ['.repository-image', '.readme-image'],
    GITLAB: ['.project-avatar', '.readme-image'],
    BITBUCKET: ['.repo-avatar', '.readme-image'],
    NPM: ['.package-image', '.readme-image'],
    ATLASSIAN: ['.confluence-image', '.jira-image'],
    SALESFORCE: ['.lightning-image', '.visualforce-image'],
    ZENDESK: ['.help-center-image', '.article-image'],
    HUBSPOT: ['.hs-featured-image', '.blog-post-image']
  },
  IMAGE_CATEGORIES: {
    DEFAULT: 'default',
    PHOTOS: 'photos',
    ICONS: 'icons',
    VECTORS: 'vectors',
    THUMBNAILS: 'thumbnails',
    BANNERS: 'banners',
    SOCIAL: 'social'
  }
};

const CATEGORY_PATTERNS = {
  PHOTOS: {
    formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    patterns: [
      /\.(jpe?g|png|webp|gif)$/i,
      /\/photos?\//i,
      /\/gallery\//i,
      /\/images?\//i,
      /\/uploads?\//i,
      /\/media\//i,
      /\/pictures?\//i,
      /\/content\/images\//i
    ],
    excludePatterns: [
      /icon/i,
      /logo/i,
      /banner/i,
      /avatar/i,
      /thumbnail/i
    ]
  },
  ICONS: {
    formats: ['ico', 'svg', 'png'],
    patterns: [
      /favicon/i,
      /\/icons?\//i,
      /icon[-_]/i,
      /[-_]icon/i,
      /\/assets\/icons?\//i,
      /app-icon/i,
      /logo[-_]icon/i
    ],
    maxSize: 128 * 1024, // 128KB max for icons
    maxDimensions: { width: 512, height: 512 }
  },
  VECTORS: {
    formats: ['svg'],
    patterns: [
      /\.svg$/i,
      /\/vectors?\//i,
      /\/svg\//i,
      /\/graphics\//i,
      /vector[-_]/i,
      /[-_]vector/i
    ]
  },
  THUMBNAILS: {
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    patterns: [
      /thumb/i,
      /thumbnail/i,
      /preview/i,
      /[-_](sm|small|xs|tiny|mini)/i,
      /\.(sm|xs|thumb)\./i
    ],
    maxDimensions: { width: 300, height: 300 }
  },
  BANNERS: {
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    patterns: [
      /banner/i,
      /header/i,
      /hero/i,
      /cover/i,
      /splash/i,
      /billboard/i,
      /masthead/i,
      /\/headers?\//i,
      /\/banners?\//i
    ],
    minDimensions: { width: 800, height: 200 }
  },
  SOCIAL: {
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    patterns: [
      /og[-_]image/i,
      /twitter[-_]image/i,
      /facebook[-_]image/i,
      /social[-_](share|image)/i,
      /meta[-_]image/i,
      /share[-_]image/i,
      /\/social\//i,
      /\/meta\//i
    ],
    preferredDimensions: {
      facebook: { width: 1200, height: 630 },
      twitter: { width: 1200, height: 600 },
      linkedin: { width: 1200, height: 627 }
    }
  }
};

// Add the interface definition
interface ImageFilterOptions {
  excludedCategories: string[];
  minWidth?: number;
  minHeight?: number;
  maxSize?: number;
  formats?: string[];
}

// Update ImageInfo interface to include dimensions
interface ImageInfo {
  url: string;
  filename?: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  dimensions?: { width: number; height: number };
  versions?: {
    thumbnail: string;
    preview: string;
    original: string;
  };
}

interface CrawlState {
  baseUrl: string;
  currentUrl: string;
  pendingUrls: string[];
  visitedUrls: Set<string>;
  imageUrls: Set<string>;
  depth: number;
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    const { hostname, pathname } = parsedUrl;
    const pathnameLower = pathname.toLowerCase();
    const hostnameLower = hostname.toLowerCase();
    
    if (CONFIG.IMAGE_DOMAINS.some(domain => hostnameLower.includes(domain))) {
      return true;
    }

    const extension = pathnameLower.split('.').pop()?.toLowerCase();
    if (extension && /^(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp|tiff|heic)$/i.test(extension)) {
      return true;
    }

    if (CONFIG.FRAMEWORK_PATHS.some(path => pathnameLower.includes(path))) {
      return true;
    }

    if (CONFIG.IMAGE_HOSTING_PATTERNS.some(pattern => pattern.test(hostnameLower))) {
      return true;
    }

    const hasImageParams = parsedUrl.searchParams.has('format') || 
                          parsedUrl.searchParams.has('width') ||
                          parsedUrl.searchParams.has('height') ||
                          parsedUrl.searchParams.has('type');
    if (hasImageParams) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function extractImageUrls($: ReturnType<typeof cheerio.load>, baseUrl: string): Promise<Set<string>> {
  const imageUrlMap = new Map<string, string>(); // normalized URL -> original URL

  try {
    $(CONFIG.IMAGE_SELECTORS.join(',')).each((_, element) => {
      const el = $(element);
      const sources = [
        el.attr('src'),
        el.attr('data-src'),
        el.attr('data-original'),
        el.attr('content'),
        el.attr('href')
      ];

      const srcset = el.attr('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',')
          .map(s => s.trim().split(' ')[0])
          .filter(Boolean);
        sources.push(...srcsetUrls);
      }

      const style = el.attr('style');
      if (style) {
        const matches = style.match(/url\(['"]?([^'"]+)['"]?\)/g);
        if (matches) {
          const urls = matches.map(m => m.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1'));
          sources.push(...urls);
        }
      }

      sources
        .filter(Boolean)
        .map(url => normalizeUrl(url!, baseUrl))
        .filter(url => url && isValidImageUrl(url))
        .forEach(url => {
          const normalizedUrl = normalizeImageUrl(url!);
          if (!imageUrlMap.has(normalizedUrl)) {
            imageUrlMap.set(normalizedUrl, url!);
          }
        });
    });

  } catch (error) {
    console.error('Error extracting image URLs:', error);
  }

  return new Set(imageUrlMap.values());
}

async function* crawlWebsite(state: CrawlState, signal: AbortSignal, filters: ImageFilterOptions) {
  const limit = pLimit(CONFIG.CONCURRENT_REQUESTS);
  const registry = new ImageRegistry();
  let processedPages = 0;
  const imageProcessingQueue = new Set<Promise<void>>();

  while (state.pendingUrls.length > 0 && processedPages < CONFIG.MAX_PAGES_TO_CRAWL) {
    if (signal.aborted) return;

    const currentUrl = state.pendingUrls.shift()!;
    if (state.visitedUrls.has(currentUrl)) continue;

    try {
      const response = await axios.get(currentUrl, {
        timeout: CONFIG.TIMEOUT,
        headers: { 'User-Agent': CONFIG.USER_AGENT }
      });

      state.visitedUrls.add(currentUrl);
      processedPages++;

      const $ = cheerio.load(response.data);
      const imageUrls = await extractImageUrls($, currentUrl);

      if (imageUrls.size > 0) {
        // Process images in smaller batches for faster initial display
        const batchSize = 5;
        const urlArray = Array.from(imageUrls);
        
        for (let i = 0; i < urlArray.length; i += batchSize) {
          const batch = urlArray.slice(i, i + batchSize);
          const validatedImages = await Promise.all(
            batch.map(url => limit(() => validateAndProcessImage(url, registry, filters)))
          );

          const newImages = validatedImages
            .filter((img): img is ImageInfo => img !== null);

          if (newImages.length > 0) {
            yield { newImages };
          }
        }
      }

      // Continue crawling in parallel
      if (state.depth < CONFIG.MAX_CRAWL_DEPTH) {
        const links = extractLinks(response.data, currentUrl, state) || [];
        state.pendingUrls.push(...links);
        state.depth++;
      }

      yield {
        crawlStatus: {
          pagesProcessed: processedPages,
          imagesFound: state.imageUrls.size,
          currentDepth: state.depth
        }
      };

    } catch (error) {
      console.warn(`Failed to process ${currentUrl}:`, error);
      continue;
    }
  }

  await Promise.all(Array.from(imageProcessingQueue));
}

function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const urlHost = new URL(url).hostname;
    const baseHost = new URL(baseUrl).hostname;
    return urlHost === baseHost || urlHost.endsWith(`.${baseHost}`);
  } catch {
    return false;
  }
}

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'image';
    return sanitizeFilename(filename);
  } catch {
    return `image_${Date.now()}`;
  }
}

async function fetchWithRetry(url: string, registry: ImageRegistry): Promise<Response | null> {
  const normalizedUrl = normalizeImageUrl(url);
  let attempt = 0;
  
  while (attempt < CONFIG.ERROR_HANDLING.MAX_RETRIES) {
    try {
      const response = await axios.get(normalizedUrl, {
        responseType: 'arraybuffer',
        timeout: CONFIG.ERROR_HANDLING.TIMEOUT_MS,
        maxRedirects: 5,
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Accept': 'image/*, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        },
        validateStatus: (status) => status === 200
      });
      
      // Verify that the response is actually an image
      const contentType = response.headers['content-type'];
      if (!contentType?.startsWith('image/')) {
        return null;
      }
      
      return new Response(response.data, {
        status: 200,
        headers: response.headers as HeadersInit
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // Add to retry queue for one final attempt later
          registry.addToRetryQueue(url);
          return null;
        }
        
        if (CONFIG.ERROR_HANDLING.ERROR_CODES.SKIP.includes(error.response?.status || 0)) {
          return null;
        }
      }
      
      attempt++;
      if (attempt < CONFIG.ERROR_HANDLING.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 
          CONFIG.ERROR_HANDLING.RETRY_DELAY * Math.pow(CONFIG.ERROR_HANDLING.BACKOFF_FACTOR, attempt)
        ));
      }
    }
  }
  return null;
}

function normalizeUrl(url: string, baseUrl: string): string | null {
  try {
    if (!url) return null;
    
    if (url.startsWith('data:')) return null;
    
    let cleanUrl = url.trim()
      .replace(/[\n\r\t]/g, '')
      .replace(/^\/\//, 'https://');
      
    cleanUrl = normalizeNextImageUrl(cleanUrl, baseUrl);
    
    const fullUrl = new URL(cleanUrl, baseUrl);
    return fullUrl.href;
  } catch {
    return null;
  }
}

function generateImageFilename(url: string, contentType: string): string {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Remove query parameters
    pathname = pathname.split('?')[0];
    
    // Get the original filename
    let filename = pathname.split('/').pop() || 'image';
    
    // Remove any duplicate extensions
    filename = filename.replace(/\.(jpg|jpeg|png|gif|webp|svg|avif)\.(jpg|jpeg|png|gif|webp|svg|avif)$/i, '.$1');
    
    // If no extension, add one based on content-type
    if (!/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(filename)) {
      const ext = mime.extension(contentType) || 'jpg';
      filename = `${filename}.${ext}`;
    }
    
    // Generate a hash of the normalized URL to ensure uniqueness
    const urlHash = crypto.createHash('md5').update(normalizeImageUrl(url)).digest('hex').slice(0, 8);
    
    // Combine filename with hash
    const basename = filename.replace(/\.[^/.]+$/, '');
    const extension = filename.split('.').pop();
    
    return sanitizeFilename(`${basename}_${urlHash}.${extension}`);
  } catch {
    return `image_${Date.now()}.jpg`;
  }
}

async function validateAndProcessImage(url: string, registry: ImageRegistry, filters: ImageFilterOptions): Promise<ImageInfo | null> {
  try {
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
    const urlLower = url.toLowerCase();
    
    const response = await fetchWithRetry(url, registry);
    if (!response || !response.ok) return null;
    
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    if (contentLength > MAX_IMAGE_SIZE) {
      console.warn(`Image too large (${contentLength} bytes): ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !isAllowedFormat(contentType, filters.formats)) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dimensions = await getImageDimensions(buffer);

    if (!filters.excludedCategories.includes('DEFAULT')) {
      const selectedCategories = Object.keys(CATEGORY_PATTERNS)
        .filter(cat => !filters.excludedCategories.includes(cat));

      if (selectedCategories.length > 0) {
        let bestMatch: { category: string; score: number } | null = null;

        for (const category of selectedCategories) {
          const pattern = CATEGORY_PATTERNS[category];
          let score = 0;

          // Format matching (higher weight for exact format matches)
          if (pattern.formats?.includes(contentType.split('/')[1])) {
            score += 3;
          }

          // URL pattern matching
          pattern.patterns.forEach((pat: { test: (arg0: string) => any; }) => {
            if (pat.test(urlLower)) score += 2;
          });

          // Exclude patterns (strong negative weight)
          if (pattern.excludePatterns?.some((pat: { test: (arg0: string) => any; }) => pat.test(urlLower))) {
            score -= 5;
          }

          // Size-based scoring
          if (arrayBuffer.byteLength < 50 * 1024) { // < 50KB
            if (category === 'ICONS') score += 2;
            if (category === 'THUMBNAILS') score += 1;
          }

          // Dimension-based scoring
          if (dimensions) {
            const { width, height } = dimensions;
            
            // Icon scoring
            if (category === 'ICONS') {
              if (width <= 64 && height <= 64) score += 3;
              else if (width <= 256 && height <= 256) score += 2;
              else if (width > 512 || height > 512) score -= 3;
            }

            // Thumbnail scoring
            if (category === 'THUMBNAILS') {
              if (width <= 300 && height <= 300) score += 2;
              else if (width > 800 || height > 800) score -= 2;
            }

            // Banner scoring
            if (category === 'BANNERS') {
              if (width >= 800 && width/height >= 2) score += 3;
              if (width < 400 || height > width) score -= 2;
            }

            // Social image scoring
            if (category === 'SOCIAL') {
              const aspectRatio = width/height;
              if (aspectRatio >= 1.8 && aspectRatio <= 2.1) score += 2; // Twitter
              if (aspectRatio >= 1.9 && aspectRatio <= 1.91) score += 2; // Facebook
            }

            // Photo scoring
            if (category === 'PHOTOS') {
              if (width >= 800 && height >= 600) score += 1;
              const aspectRatio = width/height;
              if (aspectRatio >= 0.5 && aspectRatio <= 2) score += 1;
            }
          }

          // Path-based scoring
          if (urlLower.includes(`/${category.toLowerCase()}/`)) score += 2;
          if (urlLower.includes(`/${category.toLowerCase()}s/`)) score += 2;

          // Update best match if this category scores better
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { category, score };
          }
        }

        // Require a minimum score threshold
        if (!bestMatch || bestMatch.score < 2) {
          return null;
        }
      }
    }

    // Process the image if it passed all filters
    const thumbnail = await processImage(buffer, CONFIG.IMAGE_QUALITY.thumbnail);
    const preview = await processImage(buffer, CONFIG.IMAGE_QUALITY.preview);

    return {
      url,
      filename: getFilenameFromUrl(url),
      status: 'downloading',
      dimensions,
      versions: {
        thumbnail: thumbnail.toString('base64'),
        preview: preview.toString('base64'),
        original: url
      }
    };

  } catch (error) {
    console.warn('Image validation failed:', url, error);
    return null;
  }
}

function normalizeNextImageUrl(url: string, baseUrl: string): string {
  if (url.includes('/_next/image?url=')) {
    const originalUrl = decodeURIComponent(url.split('url=')[1].split('&')[0]);
    return new URL(originalUrl, baseUrl).href;
  }
  return url;
}

function extractLinks(data: string, currentUrl: string, state: CrawlState): string[] {
  const $ = cheerio.load(data);
  const links = new Set<string>();
  
  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const normalizedUrl = normalizeUrl(href, currentUrl);
      if (normalizedUrl && 
          isSameDomain(normalizedUrl, state.baseUrl) && 
          !state.visitedUrls.has(normalizedUrl)) {
        links.add(normalizedUrl);
      }
    }
  });

  return Array.from(links);
}

async function processImage(buffer: Buffer, options: { width?: number; quality?: number; format?: string } = {}) {
  try {
    const sharp = (await import('sharp')).default;
    let processor = sharp(buffer, {
      failOnError: false,
      limitInputPixels: 268402689 // 16384 x 16384
    });

    const metadata = await processor.metadata();

    if (metadata.format === 'gif' || metadata.format === 'webp') {
      if (metadata.pages && metadata.pages > 1) {
        return buffer;
      }
    }

    processor = processor.rotate();

    if (options.width && metadata.width && metadata.width > options.width) {
      processor = processor.resize(options.width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    if (options.format === 'webp') {
      processor = processor.webp({ quality: options.quality || 80 });
    } else if (metadata.format === 'png') {
      processor = processor.png({ quality: options.quality || 80 });
    } else {
      processor = processor.jpeg({ quality: options.quality || 80 });
    }

    return processor.toBuffer();
  } catch (error) {
    console.warn('Image processing failed:', error);
    return buffer;
  }
}

function initializeCrawlState(url: string): CrawlState {
  const urlObj = new URL(url);
  return {
    baseUrl: `${urlObj.protocol}//${urlObj.host}`,
    currentUrl: url,
    pendingUrls: [url],
    visitedUrls: new Set(),
    imageUrls: new Set(),
    depth: 0
  };
}

// Update the normalizeImageUrl function to be more generic
function normalizeImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // General URL normalization
    // Handle common dynamic image parameters
    urlObj.pathname = urlObj.pathname
      .replace(/%7Bwidth%7D/g, '1000')
      .replace(/{width}/g, '1000')
      .replace(/_\d+x(?=\.[a-zA-Z]+$)/, '')
      .replace(/\/(w|h)\/\d+\//, '/') // Handle dimension paths like /w/500/
      .replace(/[@x]\d+(?=\.[a-zA-Z]+$)/, ''); // Handle retina suffixes like @2x
    
    // Remove common query parameters that affect image dimensions/quality
    const paramsToRemove = [
      'width', 'height', 'w', 'h', 
      'quality', 'q', 'size',
      'format', 'f', 'fm',
      'version', 'v', 'ver',
      'scale', 's', 'dpr',
      'auto', 'fit', 'crop',
      'max-w', 'max-h',
      'resize', 'dimensions'
    ];
    
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}

// Add these helper functions for improved image comparison
function generateImageHash(buffer: ArrayBuffer): string {
  return crypto
    .createHash('sha256')
    .update(Buffer.from(buffer))
    .digest('hex');
}

interface ProcessedImage {
  hash: string;
  url: string;
  size: number;
  type: string;
  filename: string;
}

class ImageRegistry {
  private hashes = new Map<string, ProcessedImage>();
  private urlMap = new Map<string, string>(); // URL to hash mapping
  private retryQueue = new Set<string>();
  
  isProcessed(url: string): boolean {
    return this.urlMap.has(normalizeImageUrl(url));
  }

  async addImage(url: string, buffer: ArrayBuffer, contentType: string, filename: string): Promise<boolean> {
    const normalizedUrl = normalizeImageUrl(url);
    const hash = generateImageHash(buffer);
    
    // Check if we've seen this exact image before
    if (this.hashes.has(hash)) {
      this.urlMap.set(normalizedUrl, hash);
      return false;
    }
    
    const imageInfo: ProcessedImage = {
      hash,
      url: normalizedUrl,
      size: buffer.byteLength,
      type: contentType,
      filename
    };
    
    this.hashes.set(hash, imageInfo);
    this.urlMap.set(normalizedUrl, hash);
    return true;
  }

  addToRetryQueue(url: string) {
    this.retryQueue.add(url);
  }

  getRetryUrls(): string[] {
    const urls = Array.from(this.retryQueue);
    this.retryQueue.clear();
    return urls;
  }
}

// Helper functions for filtering

function isAllowedFormat(contentType: string, allowedFormats?: string[]): boolean {
  if (!allowedFormats?.length) {
    return CONFIG.SUPPORTED_FORMATS[contentType.split(';')[0].toLowerCase()];
  }
  const format = mime.extension(contentType);
  return format ? allowedFormats.includes(format) : false;
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(buffer).metadata();
    return metadata.width && metadata.height ? 
      { width: metadata.width, height: metadata.height } : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  let streamClosed = false;

  try {
    const { url, categories } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const state = initializeCrawlState(url);
    const abortController = new AbortController();

    // Simplified filtering logic
    const filters = {
      excludedCategories: categories.includes('default') 
        ? ['DEFAULT'] // Use DEFAULT to indicate all images should be included
        : Object.keys(CATEGORY_PATTERNS)
            .filter(cat => !categories.map((c: string) => c.toUpperCase()).includes(cat))
    };

    const crawler = crawlWebsite(state, abortController.signal, filters);
    
    const stream = new TransformStream({
      transform(chunk, controller) {
        if (!streamClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      }
    });

    const writer = stream.writable.getWriter();

    (async () => {
      try {
        for await (const update of crawler) {
          if (streamClosed) break;
          await writer.write(update);
        }
      } catch (error) {
        console.error('Crawl error:', error);
        if (!streamClosed) {
          await writer.write({ error: 'Crawling failed', message: error.message });
        }
      } finally {
        if (!streamClosed) {
          await writer.close();
        }
      }
    })();

    request.signal.addEventListener('abort', () => {
      streamClosed = true;
      abortController.abort();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { urls } = await request.json();
    const limit = pLimit(CONFIG.CONCURRENT_REQUESTS);
    const zip = new JSZip();
    const registry = new ImageRegistry();
    
    const imagesFolder = zip.folder('images');
    if (!imagesFolder) throw new Error('Failed to create images folder');

    const uniqueUrls = [...new Set(urls.map(normalizeImageUrl))];
    
    // First pass - process all URLs
    const downloadPromises = uniqueUrls.map((url: string) => 
      limit(async () => {
        try {
          if (registry.isProcessed(url)) {
            return { url, status: 'duplicate' };
          }

          const response = await fetchWithRetry(url, registry);
          if (!response) return { url, status: 'error' };

          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const filename = generateImageFilename(url, contentType);
          const arrayBuffer = await response.arrayBuffer();
          
          const isUnique = await registry.addImage(url, arrayBuffer, contentType, filename);
          if (!isUnique) {
            return { url, status: 'duplicate' };
          }
          
          imagesFolder.file(filename, arrayBuffer, {
            binary: true,
            createFolders: true,
            date: new Date()
          });
          
          return {
            url,
            filename,
            size: arrayBuffer.byteLength,
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
    
    // Second pass - retry failed URLs once
    const retryUrls = registry.getRetryUrls();
    if (retryUrls.length > 0) {
      const retryPromises = retryUrls.map((url: string) =>
        limit(async () => {
          try {
            const response = await fetchWithRetry(url, registry);
            if (!response) return { url, status: 'error' };

            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const filename = generateImageFilename(url, contentType);
            const arrayBuffer = await response.arrayBuffer();
            
            imagesFolder.file(filename, arrayBuffer, {
              binary: true,
              createFolders: true,
              date: new Date()
            });
            
            return {
              url,
              filename,
              size: arrayBuffer.byteLength,
              type: contentType,
              status: 'complete'
            };
          } catch (error) {
            console.error(`Retry failed for: ${url}`, error);
            return { url, status: 'error' };
          }
        })
      );
      await Promise.all(retryPromises);
    }
    
    const zipContent = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      platform: 'UNIX'
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