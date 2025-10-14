/**
 * Home Maintenance Tracking Service
 * Provides seasonal reminders, warranty tracking, and maintenance scheduling
 * Based on property age and location
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { addDays, addMonths, addYears, differenceInYears, format } from 'date-fns';

const logger = createLogger('maintenance-service');
const db = new PrismaClient();

export interface MaintenanceSchedule {
  items: MaintenanceItemDetail[];
  upcoming: MaintenanceItemDetail[];
  overdue: MaintenanceItemDetail[];
  totalEstimatedCost: number;
}

export interface MaintenanceItemDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  frequency: string;
  nextDueDate: Date;
  lastCompletedDate?: Date;
  estimatedCost?: number;
  status: string;
  warrantyExpiration?: Date;
  recommendedProvider?: string;
}

export interface SeasonalReminder {
  season: string;
  tasks: string[];
  urgency: 'low' | 'medium' | 'high';
}

export class MaintenanceService {
  /**
   * Initialize maintenance schedule for a new property
   */
  async initializePropertyMaintenance(propertyId: string): Promise<void> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const propertyAge = property.yearBuilt
        ? new Date().getFullYear() - property.yearBuilt
        : 0;

      logger.info(`Initializing maintenance schedule for property ${propertyId} (${propertyAge} years old)`);

      // Create standard maintenance items
      const items = this.getStandardMaintenanceItems(property, propertyAge);

      for (const item of items) {
        await db.maintenanceItem.create({
          data: {
            propertyId,
            ...item
          }
        });
      }

      logger.info(`Created ${items.length} maintenance items for property ${propertyId}`);
    } catch (error: any) {
      logger.error(`Failed to initialize maintenance for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get standard maintenance items based on property characteristics
   */
  private getStandardMaintenanceItems(property: any, propertyAge: number): any[] {
    const items: any[] = [];
    const today = new Date();

    // HVAC Maintenance
    items.push({
      title: 'HVAC Filter Replacement',
      description: 'Replace air filters for optimal air quality and system efficiency',
      category: 'HVAC',
      priority: 'ROUTINE',
      frequency: 'MONTHLY',
      nextDueDate: addMonths(today, 1),
      estimatedCost: 25,
      triggeredByAge: false
    });

    items.push({
      title: 'HVAC Professional Inspection',
      description: 'Annual professional inspection and tune-up of heating and cooling systems',
      category: 'HVAC',
      priority: 'HIGH',
      frequency: 'ANNUAL',
      nextDueDate: this.getNextSeasonalDate('spring'),
      estimatedCost: 150,
      triggeredByAge: false
    });

    // HVAC replacement for older systems
    if (propertyAge >= 15) {
      items.push({
        title: 'HVAC System Evaluation',
        description: 'Systems over 15 years old may need replacement. Schedule evaluation.',
        category: 'HVAC',
        priority: 'HIGH',
        frequency: 'ONE_TIME',
        nextDueDate: addMonths(today, 1),
        estimatedCost: 5000,
        triggeredByAge: true,
        propertyAgeYears: 15
      });
    }

    // Roof Maintenance
    items.push({
      title: 'Roof Inspection',
      description: 'Inspect roof for damage, leaks, and wear',
      category: 'ROOF',
      priority: 'ROUTINE',
      frequency: 'BIANNUAL',
      nextDueDate: this.getNextSeasonalDate('spring'),
      estimatedCost: 200,
      triggeredByAge: false
    });

    if (propertyAge >= 20) {
      items.push({
        title: 'Roof Replacement Evaluation',
        description: 'Most roofs last 20-25 years. Schedule professional evaluation.',
        category: 'ROOF',
        priority: 'HIGH',
        frequency: 'ONE_TIME',
        nextDueDate: addMonths(today, 2),
        estimatedCost: 12000,
        triggeredByAge: true,
        propertyAgeYears: 20
      });
    }

    // Gutter Maintenance
    items.push({
      title: 'Gutter Cleaning',
      description: 'Clean gutters and downspouts to prevent water damage',
      category: 'EXTERIOR',
      priority: 'ROUTINE',
      frequency: 'BIANNUAL',
      nextDueDate: this.getNextSeasonalDate('fall'),
      estimatedCost: 150,
      triggeredByAge: false
    });

    // Water Heater
    items.push({
      title: 'Water Heater Inspection',
      description: 'Flush water heater and check for sediment buildup',
      category: 'PLUMBING',
      priority: 'ROUTINE',
      frequency: 'ANNUAL',
      nextDueDate: addYears(today, 1),
      estimatedCost: 100,
      triggeredByAge: false
    });

    if (propertyAge >= 10) {
      items.push({
        title: 'Water Heater Replacement Evaluation',
        description: 'Water heaters typically last 10-12 years. Consider replacement.',
        category: 'PLUMBING',
        priority: 'HIGH',
        frequency: 'ONE_TIME',
        nextDueDate: addMonths(today, 1),
        estimatedCost: 1500,
        triggeredByAge: true,
        propertyAgeYears: 10
      });
    }

    // Exterior Maintenance
    items.push({
      title: 'Exterior Paint Touch-up',
      description: 'Inspect and touch up exterior paint to prevent wood rot',
      category: 'EXTERIOR',
      priority: 'ROUTINE',
      frequency: 'ANNUAL',
      nextDueDate: this.getNextSeasonalDate('summer'),
      estimatedCost: 300,
      triggeredByAge: false
    });

    if (propertyAge >= 7) {
      items.push({
        title: 'Full Exterior Repainting',
        description: 'Exterior paint typically lasts 7-10 years',
        category: 'EXTERIOR',
        priority: 'ROUTINE',
        frequency: 'ONE_TIME',
        nextDueDate: addMonths(today, 6),
        estimatedCost: 5000,
        triggeredByAge: true,
        propertyAgeYears: 7
      });
    }

    // Plumbing
    items.push({
      title: 'Check for Water Leaks',
      description: 'Inspect faucets, pipes, and fixtures for leaks',
      category: 'PLUMBING',
      priority: 'ROUTINE',
      frequency: 'QUARTERLY',
      nextDueDate: addMonths(today, 3),
      estimatedCost: 0,
      triggeredByAge: false
    });

    // Electrical
    items.push({
      title: 'Electrical Panel Inspection',
      description: 'Professional inspection of electrical panel and wiring',
      category: 'ELECTRICAL',
      priority: 'ROUTINE',
      frequency: 'ANNUAL',
      nextDueDate: addYears(today, 1),
      estimatedCost: 150,
      triggeredByAge: false
    });

    // Appliances
    items.push({
      title: 'Appliance Maintenance',
      description: 'Clean refrigerator coils, check dishwasher, inspect washer/dryer',
      category: 'APPLIANCES',
      priority: 'ROUTINE',
      frequency: 'BIANNUAL',
      nextDueDate: addMonths(today, 6),
      estimatedCost: 100,
      triggeredByAge: false
    });

    // Seasonal Tasks
    items.push({
      title: 'Winterization',
      description: 'Prepare home for winter: insulate pipes, seal windows, check heating',
      category: 'SEASONAL',
      priority: 'HIGH',
      frequency: 'ANNUAL',
      nextDueDate: this.getNextSeasonalDate('fall'),
      estimatedCost: 200,
      triggeredByAge: false
    });

    items.push({
      title: 'Spring Home Inspection',
      description: 'Post-winter inspection: check for damage, clean outdoor areas',
      category: 'SEASONAL',
      priority: 'ROUTINE',
      frequency: 'ANNUAL',
      nextDueDate: this.getNextSeasonalDate('spring'),
      estimatedCost: 100,
      triggeredByAge: false
    });

    // Landscaping (if applicable)
    if (property.lotSize && property.lotSize > 0) {
      items.push({
        title: 'Lawn and Garden Care',
        description: 'Mowing, fertilizing, weed control, and seasonal planting',
        category: 'LANDSCAPING',
        priority: 'ROUTINE',
        frequency: 'MONTHLY',
        nextDueDate: addMonths(today, 1),
        estimatedCost: 150,
        triggeredByAge: false
      });

      items.push({
        title: 'Tree Trimming and Care',
        description: 'Professional tree trimming and health inspection',
        category: 'LANDSCAPING',
        priority: 'ROUTINE',
        frequency: 'ANNUAL',
        nextDueDate: this.getNextSeasonalDate('spring'),
        estimatedCost: 300,
        triggeredByAge: false
      });
    }

    // Chimney (if applicable)
    if (property.propertyType === 'SINGLE_FAMILY') {
      items.push({
        title: 'Chimney Inspection and Cleaning',
        description: 'Annual chimney inspection and cleaning for safe operation',
        category: 'STRUCTURAL',
        priority: 'HIGH',
        frequency: 'ANNUAL',
        nextDueDate: this.getNextSeasonalDate('fall'),
        estimatedCost: 250,
        triggeredByAge: false
      });
    }

    return items;
  }

  /**
   * Get next seasonal date for maintenance
   */
  private getNextSeasonalDate(season: 'spring' | 'summer' | 'fall' | 'winter'): Date {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    let targetMonth: number;
    switch (season) {
      case 'spring':
        targetMonth = 3; // April
        break;
      case 'summer':
        targetMonth = 6; // July
        break;
      case 'fall':
        targetMonth = 9; // October
        break;
      case 'winter':
        targetMonth = 0; // January
        break;
    }

    const targetDate = new Date(year, targetMonth, 15);

    // If target date has passed, schedule for next year
    if (targetDate < today) {
      return new Date(year + 1, targetMonth, 15);
    }

    return targetDate;
  }

  /**
   * Get maintenance schedule for property
   */
  async getMaintenanceSchedule(propertyId: string): Promise<MaintenanceSchedule> {
    try {
      const items = await db.maintenanceItem.findMany({
        where: { propertyId },
        orderBy: { nextDueDate: 'asc' }
      });

      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);

      const upcoming = items.filter(
        item => item.status === 'PENDING' &&
                item.nextDueDate > today &&
                item.nextDueDate <= thirtyDaysFromNow
      );

      const overdue = items.filter(
        item => item.status === 'PENDING' && item.nextDueDate <= today
      );

      const totalEstimatedCost = items
        .filter(item => item.status === 'PENDING')
        .reduce((sum, item) => sum + Number(item.estimatedCost || 0), 0);

      return {
        items: items.map(this.formatMaintenanceItem),
        upcoming: upcoming.map(this.formatMaintenanceItem),
        overdue: overdue.map(this.formatMaintenanceItem),
        totalEstimatedCost
      };
    } catch (error: any) {
      logger.error(`Failed to get maintenance schedule for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Format maintenance item for API response
   */
  private formatMaintenanceItem(item: any): MaintenanceItemDetail {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      frequency: item.frequency,
      nextDueDate: item.nextDueDate,
      lastCompletedDate: item.lastCompletedDate || undefined,
      estimatedCost: Number(item.estimatedCost || 0),
      status: item.status,
      warrantyExpiration: item.warrantyExpiration || undefined,
      recommendedProvider: item.recommendedProvider || undefined
    };
  }

  /**
   * Get seasonal reminders
   */
  async getSeasonalReminders(propertyId: string): Promise<SeasonalReminder[]> {
    const property = await db.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    const month = new Date().getMonth();
    const season = this.getCurrentSeason(month);

    const reminders: SeasonalReminder[] = [];

    switch (season) {
      case 'spring':
        reminders.push({
          season: 'Spring',
          tasks: [
            'Inspect roof for winter damage',
            'Clean gutters and downspouts',
            'Service air conditioning system',
            'Fertilize lawn and trim trees',
            'Check exterior paint and caulking',
            'Test sump pump operation'
          ],
          urgency: 'high'
        });
        break;

      case 'summer':
        reminders.push({
          season: 'Summer',
          tasks: [
            'Replace HVAC filters monthly',
            'Inspect and clean deck or patio',
            'Check irrigation system',
            'Power wash exterior surfaces',
            'Inspect attic ventilation',
            'Check and seal driveway cracks'
          ],
          urgency: 'medium'
        });
        break;

      case 'fall':
        reminders.push({
          season: 'Fall',
          tasks: [
            'Clean gutters and downspouts',
            'Service heating system',
            'Winterize outdoor faucets',
            'Seal windows and doors',
            'Chimney inspection and cleaning',
            'Drain and store garden hoses',
            'Aerate and overseed lawn'
          ],
          urgency: 'high'
        });
        break;

      case 'winter':
        reminders.push({
          season: 'Winter',
          tasks: [
            'Check for ice dams on roof',
            'Inspect attic insulation',
            'Test smoke and CO detectors',
            'Reverse ceiling fans',
            'Protect pipes from freezing',
            'Monitor indoor humidity levels'
          ],
          urgency: 'high'
        });
        break;
    }

    return reminders;
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Complete a maintenance item
   */
  async completeMaintenanceItem(itemId: string, actualCost?: number, notes?: string): Promise<void> {
    try {
      const item = await db.maintenanceItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new Error(`Maintenance item not found: ${itemId}`);
      }

      const today = new Date();

      // Calculate next due date based on frequency
      let nextDueDate: Date;
      switch (item.frequency) {
        case 'MONTHLY':
          nextDueDate = addMonths(today, 1);
          break;
        case 'QUARTERLY':
          nextDueDate = addMonths(today, 3);
          break;
        case 'BIANNUAL':
          nextDueDate = addMonths(today, 6);
          break;
        case 'ANNUAL':
          nextDueDate = addYears(today, 1);
          break;
        case 'BIENNIAL':
          nextDueDate = addYears(today, 2);
          break;
        default:
          nextDueDate = item.nextDueDate;
      }

      // Update item
      await db.maintenanceItem.update({
        where: { id: itemId },
        data: {
          status: item.frequency === 'ONE_TIME' ? 'COMPLETED' : 'PENDING',
          lastCompletedDate: today,
          actualCost: actualCost || item.actualCost,
          completedNotes: notes,
          nextDueDate: item.frequency === 'ONE_TIME' ? item.nextDueDate : nextDueDate
        }
      });

      logger.info(`Completed maintenance item ${itemId}`);
    } catch (error: any) {
      logger.error(`Failed to complete maintenance item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Add custom maintenance item
   */
  async addMaintenanceItem(propertyId: string, itemData: any): Promise<string> {
    try {
      const item = await db.maintenanceItem.create({
        data: {
          propertyId,
          ...itemData,
          status: 'PENDING'
        }
      });

      logger.info(`Added custom maintenance item for property ${propertyId}`);
      return item.id;
    } catch (error: any) {
      logger.error(`Failed to add maintenance item for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Send maintenance reminders (called by cron job)
   */
  async sendMaintenanceReminders(): Promise<void> {
    try {
      const sevenDaysFromNow = addDays(new Date(), 7);

      // Find items due within 7 days that haven't been notified
      const dueItems = await db.maintenanceItem.findMany({
        where: {
          status: 'PENDING',
          nextDueDate: { lte: sevenDaysFromNow },
          notificationSent: false
        },
        include: {
          property: {
            include: {
              subscriber: true
            }
          }
        }
      });

      logger.info(`Found ${dueItems.length} maintenance items requiring notification`);

      for (const item of dueItems) {
        if (!item.property.subscriber) continue;

        // Create alert
        await db.propertyAlert.create({
          data: {
            propertyId: item.propertyId,
            subscriberId: item.property.subscriberId,
            type: 'MAINTENANCE_DUE',
            severity: item.priority === 'CRITICAL' ? 'CRITICAL' : 'INFO',
            title: `Maintenance Due: ${item.title}`,
            message: `${item.description}. Due date: ${format(item.nextDueDate, 'MMMM d, yyyy')}. Estimated cost: $${item.estimatedCost || 0}.`,
            status: 'ACTIVE',
            metadata: {
              maintenanceItemId: item.id,
              category: item.category,
              estimatedCost: item.estimatedCost
            }
          }
        });

        // Mark as notified
        await db.maintenanceItem.update({
          where: { id: item.id },
          data: {
            notificationSent: true,
            notificationDate: new Date()
          }
        });
      }

      logger.info(`Sent ${dueItems.length} maintenance reminders`);
    } catch (error: any) {
      logger.error('Failed to send maintenance reminders:', error);
      throw error;
    }
  }

  /**
   * Check warranty expirations (called by cron job)
   */
  async checkWarrantyExpirations(): Promise<void> {
    try {
      const thirtyDaysFromNow = addDays(new Date(), 30);

      // Find items with warranties expiring soon
      const expiringWarranties = await db.maintenanceItem.findMany({
        where: {
          warrantyExpiration: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          },
          notificationSent: false
        },
        include: {
          property: {
            include: {
              subscriber: true
            }
          }
        }
      });

      logger.info(`Found ${expiringWarranties.length} warranties expiring soon`);

      for (const item of expiringWarranties) {
        if (!item.property.subscriber) continue;

        await db.propertyAlert.create({
          data: {
            propertyId: item.propertyId,
            subscriberId: item.property.subscriberId,
            type: 'WARRANTY_EXPIRING',
            severity: 'WARNING',
            title: `Warranty Expiring: ${item.title}`,
            message: `Your warranty for ${item.title} expires on ${format(item.warrantyExpiration!, 'MMMM d, yyyy')}. Consider scheduling service or renewal.`,
            status: 'ACTIVE',
            metadata: {
              maintenanceItemId: item.id,
              warrantyProvider: item.warrantyProvider
            }
          }
        });

        await db.maintenanceItem.update({
          where: { id: item.id },
          data: { notificationSent: true, notificationDate: new Date() }
        });
      }

      logger.info(`Sent ${expiringWarranties.length} warranty expiration alerts`);
    } catch (error: any) {
      logger.error('Failed to check warranty expirations:', error);
      throw error;
    }
  }

  /**
   * Get maintenance cost history
   */
  async getMaintenanceCostHistory(propertyId: string): Promise<any> {
    const items = await db.maintenanceItem.findMany({
      where: {
        propertyId,
        status: 'COMPLETED',
        actualCost: { not: null }
      },
      orderBy: { lastCompletedDate: 'desc' }
    });

    const totalSpent = items.reduce((sum, item) => sum + Number(item.actualCost || 0), 0);
    const averageCostPerItem = items.length > 0 ? totalSpent / items.length : 0;

    const byCategory = items.reduce((acc: any, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0 };
      }
      acc[category].count++;
      acc[category].total += Number(item.actualCost || 0);
      return acc;
    }, {});

    return {
      totalSpent,
      averageCostPerItem,
      completedItems: items.length,
      byCategory
    };
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();
