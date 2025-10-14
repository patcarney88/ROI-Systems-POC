/**
 * Image Optimization Utilities
 *
 * Provides WebP conversion, responsive images, lazy loading,
 * blur-up placeholders, and compression utilities
 */

/**
 * Convert image to WebP format with fallback
 * @param imageUrl - Original image URL
 * @returns Object with WebP and fallback URLs
 */
export function getWebPWithFallback(imageUrl: string): {
  webp: string;
  fallback: string;
} {
  const ext = imageUrl.split('.').pop()?.toLowerCase();
  const basePath = imageUrl.substring(0, imageUrl.lastIndexOf('.'));

  return {
    webp: `${basePath}.webp`,
    fallback: imageUrl
  };
}

/**
 * Generate responsive image srcset
 * @param imagePath - Base image path
 * @param widths - Array of image widths to generate
 * @returns srcset string
 */
export function generateSrcSet(imagePath: string, widths: number[] = [480, 768, 1200, 1920]): string {
  const ext = imagePath.split('.').pop();
  const basePath = imagePath.substring(0, imagePath.lastIndexOf('.'));

  return widths
    .map(width => `${basePath}-${width}w.${ext} ${width}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param breakpoints - Array of breakpoint configs
 * @returns sizes string
 */
export function generateSizes(breakpoints: Array<{ maxWidth: string; size: string }>): string {
  const sizesArray = breakpoints.map(bp => `(max-width: ${bp.maxWidth}) ${bp.size}`);
  sizesArray.push(breakpoints[breakpoints.length - 1].size); // default size
  return sizesArray.join(', ');
}

/**
 * IntersectionObserver-based lazy loading utility
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor(options: IntersectionObserverInit = {}) {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px', // Load 50px before entering viewport
          threshold: 0.01,
          ...options
        }
      );
    }
  }

  /**
   * Handle intersection events
   */
  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
        this.images.delete(img);
      }
    });
  }

  /**
   * Load image by updating src from data-src
   */
  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
    }
    if (srcset) {
      img.srcset = srcset;
    }

    img.classList.add('loaded');
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
  }

  /**
   * Observe image for lazy loading
   */
  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img);
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Disconnect observer and cleanup
   */
  disconnect() {
    this.observer?.disconnect();
    this.images.clear();
  }
}

/**
 * Create blur-up placeholder data URL
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @param color - Placeholder color (hex)
 * @returns Base64 encoded SVG data URL
 */
export function createBlurPlaceholder(
  width: number,
  height: number,
  color: string = '#e0e0e0'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
      </filter>
      <rect width="${width}" height="${height}" fill="${color}" filter="url(#blur)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Compress image quality based on connection speed
 * @param quality - Original quality (0-100)
 * @returns Adjusted quality based on connection
 */
export function getAdaptiveQuality(quality: number = 80): number {
  if (!('connection' in navigator)) {
    return quality;
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;

  const qualityMap: Record<string, number> = {
    'slow-2g': 0.5,
    '2g': 0.6,
    '3g': 0.75,
    '4g': 1.0
  };

  const multiplier = qualityMap[effectiveType] || 1.0;
  return Math.round(quality * multiplier);
}

/**
 * Generate responsive image props for img element
 */
export function getResponsiveImageProps(
  imagePath: string,
  alt: string,
  options: {
    widths?: number[];
    breakpoints?: Array<{ maxWidth: string; size: string }>;
    lazy?: boolean;
    blurPlaceholder?: boolean;
  } = {}
): {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  placeholder?: string;
} {
  const {
    widths = [480, 768, 1200],
    breakpoints,
    lazy = true,
    blurPlaceholder = true
  } = options;

  const props: any = {
    src: imagePath,
    alt,
    loading: lazy ? 'lazy' : 'eager'
  };

  if (widths.length > 0) {
    props.srcSet = generateSrcSet(imagePath, widths);
  }

  if (breakpoints) {
    props.sizes = generateSizes(breakpoints);
  }

  if (blurPlaceholder) {
    props.placeholder = createBlurPlaceholder(10, 10);
  }

  return props;
}

/**
 * Preload critical images
 * @param images - Array of image URLs to preload
 */
export function preloadImages(images: string[]): Promise<void[]> {
  return Promise.all(
    images.map(src => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
      });
    })
  );
}

/**
 * Image CDN URL builder
 * @param path - Image path
 * @param transforms - CDN transformation parameters
 * @returns CDN URL with transformations
 */
export function buildCDNUrl(
  path: string,
  transforms: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  // Example implementation for common CDN patterns
  // Adapt for your specific CDN (Cloudinary, Imgix, etc.)
  const params = new URLSearchParams();

  if (transforms.width) params.set('w', transforms.width.toString());
  if (transforms.height) params.set('h', transforms.height.toString());
  if (transforms.quality) params.set('q', transforms.quality.toString());
  if (transforms.format) params.set('f', transforms.format);
  if (transforms.fit) params.set('fit', transforms.fit);

  const cdnBase = import.meta.env.VITE_CDN_URL || '';
  return `${cdnBase}${path}?${params.toString()}`;
}

/**
 * Calculate optimal image dimensions for container
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  imageAspectRatio: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
  const actualWidth = containerWidth * devicePixelRatio;
  const actualHeight = containerHeight * devicePixelRatio;

  // Find closest standard width
  const standardWidths = [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  const optimalWidth = standardWidths.find(w => w >= actualWidth) || standardWidths[standardWidths.length - 1];

  return {
    width: optimalWidth,
    height: Math.round(optimalWidth / imageAspectRatio)
  };
}

export default {
  getWebPWithFallback,
  generateSrcSet,
  generateSizes,
  LazyImageLoader,
  createBlurPlaceholder,
  getAdaptiveQuality,
  getResponsiveImageProps,
  preloadImages,
  buildCDNUrl,
  calculateOptimalDimensions
};
