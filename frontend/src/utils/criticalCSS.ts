/**
 * Critical CSS Utilities
 *
 * Extract critical CSS for above-the-fold content,
 * defer non-critical styles, and remove unused CSS
 */

/**
 * Extract critical CSS from stylesheets
 * @param html - HTML content
 * @param viewportHeight - Viewport height for above-the-fold calculation
 * @returns Critical CSS string
 */
export async function extractCriticalCSS(
  html: string,
  viewportHeight: number = 1080
): Promise<string> {
  const criticalSelectors = new Set<string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Get all elements in viewport
  const viewportElements = doc.querySelectorAll('*');
  viewportElements.forEach(element => {
    if (element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect();
      if (rect.top < viewportHeight) {
        // Add element's classes and IDs as selectors
        if (element.id) {
          criticalSelectors.add(`#${element.id}`);
        }
        element.classList.forEach(cls => {
          criticalSelectors.add(`.${cls}`);
        });
        criticalSelectors.add(element.tagName.toLowerCase());
      }
    }
  });

  // Extract matching CSS rules
  const criticalCSS: string[] = [];
  const styleSheets = document.styleSheets;

  Array.from(styleSheets).forEach(sheet => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      Array.from(rules).forEach(rule => {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          // Check if selector matches critical elements
          if (matchesAnyCriticalSelector(selector, criticalSelectors)) {
            criticalCSS.push(rule.cssText);
          }
        } else if (rule instanceof CSSMediaRule) {
          // Include critical media queries
          criticalCSS.push(rule.cssText);
        }
      });
    } catch (e) {
      // Skip cross-origin stylesheets
      console.warn('Cannot access stylesheet:', e);
    }
  });

  return criticalCSS.join('\n');
}

/**
 * Check if selector matches any critical selectors
 */
function matchesAnyCriticalSelector(
  selector: string,
  criticalSelectors: Set<string>
): boolean {
  // Split compound selectors
  const parts = selector.split(/[,\s>+~]+/);
  return parts.some(part => criticalSelectors.has(part.trim()));
}

/**
 * Inline critical CSS into HTML head
 */
export function inlineCriticalCSS(html: string, criticalCSS: string): string {
  const styleTag = `<style id="critical-css">${criticalCSS}</style>`;

  // Insert before </head>
  return html.replace('</head>', `${styleTag}</head>`);
}

/**
 * Defer non-critical CSS loading
 */
export function deferNonCriticalCSS(stylesheetUrl: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = stylesheetUrl;

  link.onload = function() {
    this.onload = null as any;
    this.rel = 'stylesheet';
  };

  // Fallback for browsers without preload support
  const noscript = document.createElement('noscript');
  const fallbackLink = document.createElement('link');
  fallbackLink.rel = 'stylesheet';
  fallbackLink.href = stylesheetUrl;
  noscript.appendChild(fallbackLink);

  document.head.appendChild(link);
  document.head.appendChild(noscript);

  return link;
}

/**
 * Load CSS asynchronously
 */
export function loadCSSAsync(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * Remove unused CSS rules
 */
export function removeUnusedCSS(): void {
  const usedSelectors = new Set<string>();

  // Collect all used selectors from DOM
  document.querySelectorAll('*').forEach(element => {
    if (element instanceof HTMLElement) {
      if (element.id) {
        usedSelectors.add(`#${element.id}`);
      }
      element.classList.forEach(cls => {
        usedSelectors.add(`.${cls}`);
      });
      usedSelectors.add(element.tagName.toLowerCase());
    }
  });

  // Remove unused rules from stylesheets
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      const rules = sheet.cssRules || sheet.rules;
      const rulesToRemove: number[] = [];

      Array.from(rules).forEach((rule, index) => {
        if (rule instanceof CSSStyleRule) {
          if (!isRuleUsed(rule.selectorText, usedSelectors)) {
            rulesToRemove.push(index);
          }
        }
      });

      // Remove in reverse order to maintain indices
      rulesToRemove.reverse().forEach(index => {
        sheet.deleteRule(index);
      });
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  });
}

/**
 * Check if CSS rule is used in DOM
 */
function isRuleUsed(selector: string, usedSelectors: Set<string>): boolean {
  const parts = selector.split(/[,\s>+~]+/);
  return parts.some(part => {
    const cleanPart = part.trim();
    return usedSelectors.has(cleanPart) ||
           // Keep pseudo-classes and pseudo-elements
           cleanPart.includes(':') ||
           // Keep attribute selectors
           cleanPart.includes('[');
  });
}

/**
 * Generate critical CSS configuration
 */
export interface CriticalCSSConfig {
  viewportWidth: number;
  viewportHeight: number;
  timeout: number;
  minify: boolean;
  inline: boolean;
  extract: boolean;
}

export const defaultCriticalCSSConfig: CriticalCSSConfig = {
  viewportWidth: 1920,
  viewportHeight: 1080,
  timeout: 30000,
  minify: true,
  inline: true,
  extract: true
};

/**
 * Critical CSS manager class
 */
export class CriticalCSSManager {
  private config: CriticalCSSConfig;
  private criticalCSS: string = '';
  private isExtracted: boolean = false;

  constructor(config: Partial<CriticalCSSConfig> = {}) {
    this.config = { ...defaultCriticalCSSConfig, ...config };
  }

  /**
   * Extract and store critical CSS
   */
  async extract(): Promise<string> {
    if (this.isExtracted) {
      return this.criticalCSS;
    }

    const html = document.documentElement.outerHTML;
    this.criticalCSS = await extractCriticalCSS(html, this.config.viewportHeight);

    if (this.config.minify) {
      this.criticalCSS = this.minify(this.criticalCSS);
    }

    this.isExtracted = true;
    return this.criticalCSS;
  }

  /**
   * Inline critical CSS into page
   */
  inline(): void {
    if (!this.criticalCSS) {
      console.warn('No critical CSS to inline');
      return;
    }

    const style = document.createElement('style');
    style.id = 'critical-css';
    style.textContent = this.criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  /**
   * Defer loading of non-critical stylesheets
   */
  deferStylesheets(): void {
    const stylesheets = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"]:not([data-critical])'
    );

    stylesheets.forEach(link => {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = function() {
        this.onload = null as any;
        this.rel = 'stylesheet';
      };
    });
  }

  /**
   * Minify CSS string
   */
  private minify(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around punctuation
      .trim();
  }

  /**
   * Get critical CSS
   */
  getCriticalCSS(): string {
    return this.criticalCSS;
  }

  /**
   * Clear stored critical CSS
   */
  clear(): void {
    this.criticalCSS = '';
    this.isExtracted = false;
  }
}

/**
 * Utility to split CSS into critical and non-critical
 */
export function splitCSS(
  css: string,
  criticalSelectors: string[]
): { critical: string; nonCritical: string } {
  const criticalRules: string[] = [];
  const nonCriticalRules: string[] = [];

  // Simple CSS parser (for basic use cases)
  const rulePattern = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = rulePattern.exec(css)) !== null) {
    const [fullMatch, selector, declaration] = match;
    const isCritical = criticalSelectors.some(s =>
      selector.trim().includes(s)
    );

    if (isCritical) {
      criticalRules.push(fullMatch);
    } else {
      nonCriticalRules.push(fullMatch);
    }
  }

  return {
    critical: criticalRules.join('\n'),
    nonCritical: nonCriticalRules.join('\n')
  };
}

/**
 * Preload critical fonts
 */
export function preloadCriticalFonts(fontUrls: string[]): void {
  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = url;
    document.head.appendChild(link);
  });
}

export default {
  extractCriticalCSS,
  inlineCriticalCSS,
  deferNonCriticalCSS,
  loadCSSAsync,
  removeUnusedCSS,
  CriticalCSSManager,
  splitCSS,
  preloadCriticalFonts
};
