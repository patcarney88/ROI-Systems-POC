/**
 * Personalization Engine
 * Handles merge tags, dynamic content, and property data integration
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { format, formatDistance, differenceInYears, differenceInDays } from 'date-fns';

const logger = createLogger('personalization');
const db = new PrismaClient();

export interface MergeTagData {
  subscriber?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  client?: {
    propertyAddress?: string;
    closingDate?: Date;
    purchasePrice?: number;
    loanAmount?: number;
    propertyType?: string;
  };
  property?: {
    currentValue?: number;
    valueChange?: number;
    valueChangePercent?: number;
    squareFeet?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
  };
  agent?: {
    name?: string;
    email?: string;
    phone?: string;
    title?: string;
    photo?: string;
  };
  company?: {
    name?: string;
    logo?: string;
    website?: string;
    phone?: string;
    address?: string;
  };
  neighborhood?: {
    name?: string;
    medianPrice?: number;
    averageDaysOnMarket?: number;
    schoolRating?: number;
  };
  custom?: Record<string, any>;
}

export class PersonalizationService {
  /**
   * Get complete merge tag data for a subscriber
   */
  async getMergeTagData(subscriberId: string, campaignId?: string): Promise<MergeTagData> {
    try {
      const subscriber = await db.emailSubscriber.findUnique({
        where: { id: subscriberId },
        include: {
          client: true,
          propertyData: {
            include: {
              neighborhoodData: true
            }
          },
          organization: true
        }
      });

      if (!subscriber) {
        throw new Error(`Subscriber not found: ${subscriberId}`);
      }

      // Get agent data if available
      let agent: any = null;
      if (subscriber.agentId) {
        agent = await db.user.findUnique({
          where: { id: subscriber.agentId },
          select: {
            name: true,
            email: true,
            phone: true,
            title: true,
            avatarUrl: true
          }
        });
      }

      // Calculate property value changes
      let valueChange = 0;
      let valueChangePercent = 0;

      if (subscriber.propertyData && subscriber.client) {
        const currentValue = subscriber.propertyData.currentValue || 0;
        const purchasePrice = subscriber.client.purchasePrice || 0;

        if (purchasePrice > 0) {
          valueChange = currentValue - purchasePrice;
          valueChangePercent = (valueChange / purchasePrice) * 100;
        }
      }

      // Build merge tag data object
      const mergeData: MergeTagData = {
        subscriber: {
          firstName: subscriber.firstName,
          lastName: subscriber.lastName,
          email: subscriber.email,
          phone: subscriber.phone || undefined
        },
        client: subscriber.client
          ? {
              propertyAddress: subscriber.client.propertyAddress,
              closingDate: subscriber.client.closingDate,
              purchasePrice: subscriber.client.purchasePrice || undefined,
              loanAmount: subscriber.client.loanAmount || undefined,
              propertyType: subscriber.client.propertyType
            }
          : undefined,
        property: subscriber.propertyData
          ? {
              currentValue: subscriber.propertyData.currentValue || undefined,
              valueChange: valueChange || undefined,
              valueChangePercent: valueChangePercent || undefined,
              squareFeet: subscriber.propertyData.squareFeet || undefined,
              bedrooms: subscriber.propertyData.bedrooms || undefined,
              bathrooms: subscriber.propertyData.bathrooms || undefined,
              yearBuilt: subscriber.propertyData.yearBuilt || undefined
            }
          : undefined,
        agent: agent
          ? {
              name: agent.name,
              email: agent.email,
              phone: agent.phone || undefined,
              title: agent.title || undefined,
              photo: agent.avatarUrl || undefined
            }
          : undefined,
        company: {
          name: subscriber.organization.name,
          logo: subscriber.organization.logoUrl || undefined,
          website: subscriber.organization.website || undefined,
          phone: subscriber.organization.phone || undefined,
          address: subscriber.organization.address || undefined
        },
        neighborhood: subscriber.propertyData?.neighborhoodData
          ? {
              name: subscriber.propertyData.neighborhoodData.name,
              medianPrice: subscriber.propertyData.neighborhoodData.medianHomePrice || undefined,
              averageDaysOnMarket: subscriber.propertyData.neighborhoodData.averageDaysOnMarket || undefined,
              schoolRating: subscriber.propertyData.neighborhoodData.schoolRating || undefined
            }
          : undefined,
        custom: {}
      };

      return mergeData;
    } catch (error: any) {
      logger.error(`Failed to get merge tag data for ${subscriberId}:`, error);
      throw error;
    }
  }

  /**
   * Replace merge tags in content
   */
  replaceMergeTags(content: string, data: MergeTagData): string {
    let result = content;

    // Subscriber merge tags
    if (data.subscriber) {
      result = result.replace(/{{subscriber\.firstName}}/gi, data.subscriber.firstName || '');
      result = result.replace(/{{subscriber\.lastName}}/gi, data.subscriber.lastName || '');
      result = result.replace(/{{subscriber\.email}}/gi, data.subscriber.email || '');
      result = result.replace(/{{subscriber\.phone}}/gi, data.subscriber.phone || '');
      result = result.replace(
        /{{subscriber\.fullName}}/gi,
        `${data.subscriber.firstName || ''} ${data.subscriber.lastName || ''}`.trim()
      );
    }

    // Client merge tags
    if (data.client) {
      result = result.replace(/{{client\.propertyAddress}}/gi, data.client.propertyAddress || '');
      result = result.replace(/{{client\.propertyType}}/gi, data.client.propertyType || '');

      if (data.client.closingDate) {
        result = result.replace(
          /{{client\.closingDate}}/gi,
          format(data.client.closingDate, 'MMMM d, yyyy')
        );
        result = result.replace(
          /{{client\.closingYear}}/gi,
          format(data.client.closingDate, 'yyyy')
        );
        result = result.replace(
          /{{client\.yearsOwned}}/gi,
          String(differenceInYears(new Date(), data.client.closingDate))
        );
      }

      if (data.client.purchasePrice) {
        result = result.replace(
          /{{client\.purchasePrice}}/gi,
          this.formatCurrency(data.client.purchasePrice)
        );
      }
    }

    // Property merge tags
    if (data.property) {
      if (data.property.currentValue) {
        result = result.replace(
          /{{property\.currentValue}}/gi,
          this.formatCurrency(data.property.currentValue)
        );
      }

      if (data.property.valueChange) {
        result = result.replace(
          /{{property\.valueChange}}/gi,
          this.formatCurrency(Math.abs(data.property.valueChange))
        );
        result = result.replace(
          /{{property\.valueChangePercent}}/gi,
          `${Math.abs(data.property.valueChangePercent || 0).toFixed(1)}%`
        );
        result = result.replace(
          /{{property\.valueDirection}}/gi,
          (data.property.valueChange || 0) >= 0 ? 'increased' : 'decreased'
        );
      }

      result = result.replace(/{{property\.squareFeet}}/gi, String(data.property.squareFeet || ''));
      result = result.replace(/{{property\.bedrooms}}/gi, String(data.property.bedrooms || ''));
      result = result.replace(/{{property\.bathrooms}}/gi, String(data.property.bathrooms || ''));
      result = result.replace(/{{property\.yearBuilt}}/gi, String(data.property.yearBuilt || ''));
    }

    // Agent merge tags
    if (data.agent) {
      result = result.replace(/{{agent\.name}}/gi, data.agent.name || '');
      result = result.replace(/{{agent\.email}}/gi, data.agent.email || '');
      result = result.replace(/{{agent\.phone}}/gi, data.agent.phone || '');
      result = result.replace(/{{agent\.title}}/gi, data.agent.title || '');
      result = result.replace(/{{agent\.photo}}/gi, data.agent.photo || '');
    }

    // Company merge tags
    if (data.company) {
      result = result.replace(/{{company\.name}}/gi, data.company.name || '');
      result = result.replace(/{{company\.logo}}/gi, data.company.logo || '');
      result = result.replace(/{{company\.website}}/gi, data.company.website || '');
      result = result.replace(/{{company\.phone}}/gi, data.company.phone || '');
      result = result.replace(/{{company\.address}}/gi, data.company.address || '');
    }

    // Neighborhood merge tags
    if (data.neighborhood) {
      result = result.replace(/{{neighborhood\.name}}/gi, data.neighborhood.name || '');
      if (data.neighborhood.medianPrice) {
        result = result.replace(
          /{{neighborhood\.medianPrice}}/gi,
          this.formatCurrency(data.neighborhood.medianPrice)
        );
      }
      result = result.replace(
        /{{neighborhood\.averageDaysOnMarket}}/gi,
        String(data.neighborhood.averageDaysOnMarket || '')
      );
      result = result.replace(
        /{{neighborhood\.schoolRating}}/gi,
        String(data.neighborhood.schoolRating || '')
      );
    }

    // Custom merge tags
    if (data.custom) {
      for (const [key, value] of Object.entries(data.custom)) {
        const regex = new RegExp(`{{custom\\.${key}}}`, 'gi');
        result = result.replace(regex, String(value || ''));
      }
    }

    // Date/time merge tags
    result = result.replace(/{{today}}/gi, format(new Date(), 'MMMM d, yyyy'));
    result = result.replace(/{{year}}/gi, format(new Date(), 'yyyy'));
    result = result.replace(/{{month}}/gi, format(new Date(), 'MMMM'));

    return result;
  }

  /**
   * Get available merge tags for a campaign type
   */
  getAvailableMergeTags(campaignType: string): string[] {
    const baseTags = [
      '{{subscriber.firstName}}',
      '{{subscriber.lastName}}',
      '{{subscriber.fullName}}',
      '{{subscriber.email}}',
      '{{company.name}}',
      '{{company.logo}}',
      '{{company.website}}',
      '{{company.phone}}',
      '{{agent.name}}',
      '{{agent.email}}',
      '{{agent.phone}}',
      '{{today}}',
      '{{year}}',
      '{{month}}'
    ];

    const propertyTags = [
      '{{client.propertyAddress}}',
      '{{client.closingDate}}',
      '{{client.closingYear}}',
      '{{client.yearsOwned}}',
      '{{client.purchasePrice}}',
      '{{property.currentValue}}',
      '{{property.valueChange}}',
      '{{property.valueChangePercent}}',
      '{{property.valueDirection}}',
      '{{property.squareFeet}}',
      '{{property.bedrooms}}',
      '{{property.bathrooms}}',
      '{{property.yearBuilt}}'
    ];

    const neighborhoodTags = [
      '{{neighborhood.name}}',
      '{{neighborhood.medianPrice}}',
      '{{neighborhood.averageDaysOnMarket}}',
      '{{neighborhood.schoolRating}}'
    ];

    switch (campaignType) {
      case 'CLOSING_ANNIVERSARY':
        return [...baseTags, ...propertyTags, '{{client.yearsOwned}}'];

      case 'HOME_VALUE_UPDATE':
        return [...baseTags, ...propertyTags, ...neighborhoodTags];

      case 'MARKET_REPORT':
        return [...baseTags, ...neighborhoodTags, '{{client.propertyAddress}}'];

      case 'TAX_SEASON':
        return [
          ...baseTags,
          '{{client.propertyAddress}}',
          '{{client.purchasePrice}}',
          '{{property.currentValue}}'
        ];

      case 'MAINTENANCE_TIPS':
        return [
          ...baseTags,
          '{{client.propertyAddress}}',
          '{{property.yearBuilt}}',
          '{{client.yearsOwned}}'
        ];

      default:
        return baseTags;
    }
  }

  /**
   * Format currency
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Create personalized subject line
   */
  async personalizeSubject(subject: string, subscriberId: string): Promise<string> {
    const mergeData = await this.getMergeTagData(subscriberId);
    return this.replaceMergeTags(subject, mergeData);
  }

  /**
   * Create personalized email content
   */
  async personalizeContent(htmlContent: string, subscriberId: string): Promise<string> {
    const mergeData = await this.getMergeTagData(subscriberId);
    return this.replaceMergeTags(htmlContent, mergeData);
  }

  /**
   * Validate merge tags in content
   */
  validateMergeTags(content: string, availableTags: string[]): { valid: boolean; invalidTags: string[] } {
    const tagRegex = /{{([^}]+)}}/g;
    const foundTags = content.match(tagRegex) || [];
    const invalidTags = foundTags.filter((tag) => !availableTags.includes(tag));

    return {
      valid: invalidTags.length === 0,
      invalidTags
    };
  }

  /**
   * Get merge tag preview data (for testing)
   */
  getPreviewData(): MergeTagData {
    return {
      subscriber: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567'
      },
      client: {
        propertyAddress: '123 Main Street, Anytown, CA 12345',
        closingDate: new Date('2022-06-15'),
        purchasePrice: 450000,
        loanAmount: 360000,
        propertyType: 'Single Family'
      },
      property: {
        currentValue: 525000,
        valueChange: 75000,
        valueChangePercent: 16.67,
        squareFeet: 2100,
        bedrooms: 4,
        bathrooms: 2.5,
        yearBuilt: 2010
      },
      agent: {
        name: 'Jane Smith',
        email: 'jane.smith@roisystems.com',
        phone: '(555) 987-6543',
        title: 'Senior Real Estate Agent',
        photo: 'https://example.com/photos/jane-smith.jpg'
      },
      company: {
        name: 'ROI Systems Title Company',
        logo: 'https://example.com/logo.png',
        website: 'https://roisystems.com',
        phone: '(555) 555-5555',
        address: '456 Business Blvd, Suite 200, Anytown, CA 12345'
      },
      neighborhood: {
        name: 'Oak Hills',
        medianPrice: 485000,
        averageDaysOnMarket: 28,
        schoolRating: 8.5
      },
      custom: {}
    };
  }
}

// Export singleton instance
export const personalizationService = new PersonalizationService();
