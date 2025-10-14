/**
 * User Agent Parser Service
 *
 * Parses user agent strings to detect:
 * - Device type (desktop, mobile, tablet)
 * - Email client (Gmail, Outlook, Apple Mail, etc.)
 * - Browser
 * - Operating system
 */

import UAParser from 'ua-parser-js';
import { createLogger } from '../../utils/logger';

const logger = createLogger('user-agent-parser');

export enum EmailClient {
  GMAIL = 'Gmail',
  OUTLOOK = 'Outlook',
  APPLE_MAIL = 'Apple Mail',
  YAHOO_MAIL = 'Yahoo Mail',
  THUNDERBIRD = 'Thunderbird',
  SAMSUNG_MAIL = 'Samsung Mail',
  ANDROID_MAIL = 'Android Mail',
  IOS_MAIL = 'iOS Mail',
  WINDOWS_MAIL = 'Windows Mail',
  WEBMAIL = 'Webmail',
  OTHER = 'Other'
}

export enum DeviceCategory {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown'
}

export interface ParsedUserAgent {
  device: {
    type: DeviceCategory;
    vendor?: string;
    model?: string;
  };
  browser: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
  };
  emailClient?: EmailClient;
  raw: string;
}

class UserAgentParserService {
  /**
   * Parse user agent string
   */
  parseUserAgent(userAgent: string): ParsedUserAgent {
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      // Detect email client
      const emailClient = this.detectEmailClient(userAgent);

      // Categorize device
      const deviceCategory = this.categorizeDevice(userAgent, result);

      return {
        device: {
          type: deviceCategory,
          vendor: result.device.vendor,
          model: result.device.model
        },
        browser: {
          name: result.browser.name,
          version: result.browser.version
        },
        os: {
          name: result.os.name,
          version: result.os.version
        },
        emailClient,
        raw: userAgent
      };
    } catch (error) {
      logger.error('Failed to parse user agent:', error);
      return {
        device: { type: DeviceCategory.UNKNOWN },
        browser: {},
        os: {},
        emailClient: EmailClient.OTHER,
        raw: userAgent
      };
    }
  }

  /**
   * Detect email client from user agent
   */
  detectEmailClient(userAgent: string): EmailClient {
    const ua = userAgent.toLowerCase();

    // Gmail
    if (ua.includes('gmail') || ua.includes('google') && ua.includes('mail')) {
      return EmailClient.GMAIL;
    }

    // Outlook
    if (ua.includes('outlook') || ua.includes('microsoft outlook')) {
      return EmailClient.OUTLOOK;
    }

    // Apple Mail
    if (ua.includes('apple mail') || (ua.includes('applewebkit') && ua.includes('mail'))) {
      return EmailClient.APPLE_MAIL;
    }

    // iOS Mail
    if (ua.includes('iphone') || ua.includes('ipad')) {
      return EmailClient.IOS_MAIL;
    }

    // Yahoo Mail
    if (ua.includes('yahoo') && ua.includes('mail')) {
      return EmailClient.YAHOO_MAIL;
    }

    // Thunderbird
    if (ua.includes('thunderbird')) {
      return EmailClient.THUNDERBIRD;
    }

    // Samsung Mail
    if (ua.includes('samsung') && ua.includes('mail')) {
      return EmailClient.SAMSUNG_MAIL;
    }

    // Android Mail
    if (ua.includes('android') && ua.includes('mail')) {
      return EmailClient.ANDROID_MAIL;
    }

    // Windows Mail
    if (ua.includes('windows') && ua.includes('mail')) {
      return EmailClient.WINDOWS_MAIL;
    }

    // Webmail (browser-based)
    if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
      return EmailClient.WEBMAIL;
    }

    return EmailClient.OTHER;
  }

  /**
   * Categorize device type
   */
  categorizeDevice(userAgent: string, parsedResult: UAParser.IResult): DeviceCategory {
    const ua = userAgent.toLowerCase();
    const deviceType = parsedResult.device.type;

    // Check parsed result first
    if (deviceType === 'mobile') {
      return DeviceCategory.MOBILE;
    }
    if (deviceType === 'tablet') {
      return DeviceCategory.TABLET;
    }

    // Additional heuristics
    if (ua.includes('ipad') || ua.includes('tablet') || ua.includes('kindle')) {
      return DeviceCategory.TABLET;
    }

    if (ua.includes('iphone') || ua.includes('android') && !ua.includes('tablet') ||
        ua.includes('mobile') || ua.includes('phone')) {
      return DeviceCategory.MOBILE;
    }

    // Default to desktop for typical browsers
    if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux') ||
        ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari')) {
      return DeviceCategory.DESKTOP;
    }

    return DeviceCategory.UNKNOWN;
  }

  /**
   * Get device type display name
   */
  getDeviceTypeName(category: DeviceCategory): string {
    switch (category) {
      case DeviceCategory.DESKTOP:
        return 'Desktop';
      case DeviceCategory.MOBILE:
        return 'Mobile';
      case DeviceCategory.TABLET:
        return 'Tablet';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get email client display name
   */
  getEmailClientName(client: EmailClient): string {
    return client as string;
  }

  /**
   * Parse batch of user agents (optimized)
   */
  parseBatch(userAgents: string[]): ParsedUserAgent[] {
    return userAgents.map(ua => this.parseUserAgent(ua));
  }

  /**
   * Get device breakdown from user agents
   */
  getDeviceBreakdown(userAgents: string[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0
    };

    userAgents.forEach(ua => {
      const parsed = this.parseUserAgent(ua);
      breakdown[parsed.device.type]++;
    });

    return breakdown;
  }

  /**
   * Get email client breakdown from user agents
   */
  getEmailClientBreakdown(userAgents: string[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    userAgents.forEach(ua => {
      const parsed = this.parseUserAgent(ua);
      const client = parsed.emailClient || EmailClient.OTHER;
      breakdown[client] = (breakdown[client] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Get browser breakdown from user agents
   */
  getBrowserBreakdown(userAgents: string[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    userAgents.forEach(ua => {
      const parsed = this.parseUserAgent(ua);
      const browser = parsed.browser.name || 'Unknown';
      breakdown[browser] = (breakdown[browser] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Get OS breakdown from user agents
   */
  getOSBreakdown(userAgents: string[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    userAgents.forEach(ua => {
      const parsed = this.parseUserAgent(ua);
      const os = parsed.os.name || 'Unknown';
      breakdown[os] = (breakdown[os] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Check if user agent is mobile
   */
  isMobile(userAgent: string): boolean {
    const parsed = this.parseUserAgent(userAgent);
    return parsed.device.type === DeviceCategory.MOBILE;
  }

  /**
   * Check if user agent is desktop
   */
  isDesktop(userAgent: string): boolean {
    const parsed = this.parseUserAgent(userAgent);
    return parsed.device.type === DeviceCategory.DESKTOP;
  }

  /**
   * Check if user agent is tablet
   */
  isTablet(userAgent: string): boolean {
    const parsed = this.parseUserAgent(userAgent);
    return parsed.device.type === DeviceCategory.TABLET;
  }
}

// Export singleton instance
export const userAgentParserService = new UserAgentParserService();
