/**
 * Financial Calculations Service
 * Provides equity tracking, refinance analysis, and mortgage amortization calculations
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { addMonths, differenceInMonths } from 'date-fns';

const logger = createLogger('financial-service');
const db = new PrismaClient();

export interface EquitySnapshot {
  propertyValue: number;
  loanBalance: number;
  homeEquity: number;
  equityPercent: number;
  loanToValue: number;
  monthlyPayment: number;
  interestRate: number;
}

export interface RefinanceAnalysis {
  currentRate: number;
  currentPayment: number;
  currentBalance: number;
  remainingTerm: number;

  recommendedRate: number;
  newPayment: number;
  monthlySavings: number;
  lifetimeSavings: number;

  breakEvenMonths: number;
  closingCosts: number;
  isRecommended: boolean;
  rationale: string;
}

export interface AmortizationSchedule {
  month: number;
  date: Date;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface MonthlyPaymentBreakdown {
  principalAndInterest: number;
  principal: number;
  interest: number;
  propertyTax: number;
  insurance: number;
  hoaFees: number;
  totalPayment: number;
}

export class FinancialService {
  /**
   * Get current equity snapshot for a property
   */
  async getEquitySnapshot(propertyId: string): Promise<EquitySnapshot> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId },
        include: {
          financialSnapshots: {
            orderBy: { snapshotDate: 'desc' },
            take: 1
          }
        }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Calculate current loan balance
      const currentBalance = await this.calculateCurrentLoanBalance(
        Number(property.originalLoanAmount || 0),
        property.interestRate || 0,
        property.loanTerm || 360,
        property.purchaseDate || new Date()
      );

      // Get current property value
      const propertyValue = Number(property.currentValue || property.purchasePrice || 0);

      // Calculate equity
      const homeEquity = propertyValue - currentBalance;
      const equityPercent = propertyValue > 0 ? (homeEquity / propertyValue) * 100 : 0;
      const loanToValue = propertyValue > 0 ? (currentBalance / propertyValue) * 100 : 0;

      // Calculate monthly payment
      const monthlyPayment = this.calculateMonthlyPayment(
        currentBalance,
        property.interestRate || 0,
        property.loanTerm || 360
      );

      return {
        propertyValue,
        loanBalance: currentBalance,
        homeEquity,
        equityPercent: Math.round(equityPercent * 100) / 100,
        loanToValue: Math.round(loanToValue * 100) / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        interestRate: property.interestRate || 0
      };
    } catch (error: any) {
      logger.error(`Failed to get equity snapshot for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze refinance opportunities
   */
  async analyzeRefinanceOpportunity(propertyId: string, newRate?: number): Promise<RefinanceAnalysis> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const currentRate = property.interestRate || 0;
      const originalAmount = Number(property.originalLoanAmount || 0);
      const loanTerm = property.loanTerm || 360;
      const purchaseDate = property.purchaseDate || new Date();

      // Calculate current loan balance
      const currentBalance = await this.calculateCurrentLoanBalance(
        originalAmount,
        currentRate,
        loanTerm,
        purchaseDate
      );

      // Calculate remaining term
      const monthsElapsed = differenceInMonths(new Date(), purchaseDate);
      const remainingTerm = Math.max(loanTerm - monthsElapsed, 0);

      // Current monthly payment
      const currentPayment = this.calculateMonthlyPayment(originalAmount, currentRate, loanTerm);

      // Recommended new rate (use provided or get current market rate - 0.5% as aggressive target)
      const recommendedRate = newRate || Math.max(currentRate - 0.5, 2.5);

      // New monthly payment with recommended rate
      const newPayment = this.calculateMonthlyPayment(currentBalance, recommendedRate, remainingTerm);

      // Calculate savings
      const monthlySavings = currentPayment - newPayment;
      const lifetimeSavings = monthlySavings * remainingTerm;

      // Estimate closing costs (typically 2-5% of loan amount)
      const closingCosts = currentBalance * 0.03; // 3% average

      // Calculate break-even point
      const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : 999;

      // Determine if refinancing is recommended
      const rateDifferential = currentRate - recommendedRate;
      const isRecommended = rateDifferential >= 0.5 && breakEvenMonths <= 36 && monthlySavings >= 100;

      let rationale = '';
      if (isRecommended) {
        rationale = `Refinancing could save you $${Math.round(monthlySavings)} per month and $${Math.round(lifetimeSavings).toLocaleString()} over the life of the loan. Break-even point is ${breakEvenMonths} months.`;
      } else if (rateDifferential < 0.5) {
        rationale = `Current rate differential (${rateDifferential.toFixed(2)}%) is too small to justify refinancing costs.`;
      } else if (breakEvenMonths > 36) {
        rationale = `Break-even point of ${breakEvenMonths} months is too long to make refinancing worthwhile.`;
      } else {
        rationale = `Monthly savings of $${Math.round(monthlySavings)} are insufficient to offset closing costs.`;
      }

      // Create alert if refinancing is recommended
      if (isRecommended && property.subscriberId) {
        await this.createRefinanceAlert(propertyId, property.subscriberId, monthlySavings, lifetimeSavings);
      }

      return {
        currentRate,
        currentPayment: Math.round(currentPayment * 100) / 100,
        currentBalance: Math.round(currentBalance * 100) / 100,
        remainingTerm,
        recommendedRate,
        newPayment: Math.round(newPayment * 100) / 100,
        monthlySavings: Math.round(monthlySavings * 100) / 100,
        lifetimeSavings: Math.round(lifetimeSavings * 100) / 100,
        breakEvenMonths,
        closingCosts: Math.round(closingCosts * 100) / 100,
        isRecommended,
        rationale
      };
    } catch (error: any) {
      logger.error(`Failed to analyze refinance opportunity for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Generate amortization schedule
   */
  async generateAmortizationSchedule(
    propertyId: string,
    includeAll: boolean = false
  ): Promise<AmortizationSchedule[]> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      const originalAmount = Number(property.originalLoanAmount || 0);
      const interestRate = property.interestRate || 0;
      const loanTerm = property.loanTerm || 360;
      const startDate = property.purchaseDate || new Date();

      const schedule = this.calculateAmortizationSchedule(
        originalAmount,
        interestRate,
        loanTerm,
        startDate
      );

      // If not including all, return only future payments
      if (!includeAll) {
        const monthsElapsed = differenceInMonths(new Date(), startDate);
        return schedule.filter(entry => entry.month >= monthsElapsed);
      }

      return schedule;
    } catch (error: any) {
      logger.error(`Failed to generate amortization schedule for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Get monthly payment breakdown
   */
  async getMonthlyPaymentBreakdown(propertyId: string): Promise<MonthlyPaymentBreakdown> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Calculate P&I
      const originalAmount = Number(property.originalLoanAmount || 0);
      const interestRate = property.interestRate || 0;
      const loanTerm = property.loanTerm || 360;

      const principalAndInterest = this.calculateMonthlyPayment(originalAmount, interestRate, loanTerm);

      // Get current month's principal/interest split
      const monthsElapsed = differenceInMonths(new Date(), property.purchaseDate || new Date());
      const schedule = this.calculateAmortizationSchedule(originalAmount, interestRate, loanTerm, property.purchaseDate || new Date());
      const currentMonth = schedule[monthsElapsed] || schedule[0];

      const principal = currentMonth?.principal || 0;
      const interest = currentMonth?.interest || 0;

      // Get other costs
      const propertyTax = Number(property.annualPropertyTax || 0) / 12;
      const insurance = Number(property.annualInsurance || 0) / 12;
      const hoaFees = Number(property.hoaFees || 0);

      const totalPayment = principalAndInterest + propertyTax + insurance + hoaFees;

      return {
        principalAndInterest: Math.round(principalAndInterest * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        propertyTax: Math.round(propertyTax * 100) / 100,
        insurance: Math.round(insurance * 100) / 100,
        hoaFees: Math.round(hoaFees * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100
      };
    } catch (error: any) {
      logger.error(`Failed to get monthly payment breakdown for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Create financial snapshot (quarterly)
   */
  async createFinancialSnapshot(propertyId: string): Promise<void> {
    try {
      const property = await db.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Get equity snapshot
      const equity = await this.getEquitySnapshot(propertyId);

      // Get refinance analysis
      const refinance = await this.analyzeRefinanceOpportunity(propertyId);

      // Get payment breakdown
      const breakdown = await this.getMonthlyPaymentBreakdown(propertyId);

      // Calculate remaining term
      const monthsElapsed = differenceInMonths(new Date(), property.purchaseDate || new Date());
      const remainingTerm = Math.max((property.loanTerm || 360) - monthsElapsed, 0);

      // Create snapshot
      await db.financialSnapshot.create({
        data: {
          propertyId,
          snapshotDate: new Date(),
          estimatedValue: equity.propertyValue,
          principalBalance: equity.loanBalance,
          interestRate: equity.interestRate,
          monthlyPayment: breakdown.principalAndInterest,
          remainingTerm,
          homeEquity: equity.homeEquity,
          equityPercent: equity.equityPercent,
          loanToValue: equity.loanToValue,
          principalPayment: breakdown.principal,
          interestPayment: breakdown.interest,
          propertyTax: breakdown.propertyTax,
          insurance: breakdown.insurance,
          hoaFees: breakdown.hoaFees,
          totalMonthlyPayment: breakdown.totalPayment,
          potentialNewRate: refinance.isRecommended ? refinance.recommendedRate : null,
          potentialSavings: refinance.isRecommended ? refinance.monthlySavings : null,
          refinanceRecommended: refinance.isRecommended
        }
      });

      logger.info(`Created financial snapshot for property ${propertyId}`);
    } catch (error: any) {
      logger.error(`Failed to create financial snapshot for ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate current loan balance using amortization
   */
  private async calculateCurrentLoanBalance(
    originalAmount: number,
    annualRate: number,
    termMonths: number,
    startDate: Date
  ): Promise<number> {
    const monthsElapsed = Math.max(differenceInMonths(new Date(), startDate), 0);

    if (monthsElapsed >= termMonths) {
      return 0; // Loan paid off
    }

    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = this.calculateMonthlyPayment(originalAmount, annualRate, termMonths);

    let balance = originalAmount;

    for (let month = 0; month < monthsElapsed; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
    }

    return Math.max(balance, 0);
  }

  /**
   * Calculate monthly payment (P&I only)
   */
  private calculateMonthlyPayment(loanAmount: number, annualRate: number, termMonths: number): number {
    if (loanAmount <= 0 || annualRate <= 0 || termMonths <= 0) return 0;

    const monthlyRate = annualRate / 100 / 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                    (Math.pow(1 + monthlyRate, termMonths) - 1);

    return payment;
  }

  /**
   * Calculate full amortization schedule
   */
  private calculateAmortizationSchedule(
    loanAmount: number,
    annualRate: number,
    termMonths: number,
    startDate: Date
  ): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = [];
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = this.calculateMonthlyPayment(loanAmount, annualRate, termMonths);

    let balance = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    for (let month = 0; month < termMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;

      balance -= principalPayment;
      cumulativeInterest += interestPayment;
      cumulativePrincipal += principalPayment;

      schedule.push({
        month: month + 1,
        date: addMonths(startDate, month + 1),
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
        cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100
      });
    }

    return schedule;
  }

  /**
   * Create refinance opportunity alert
   */
  private async createRefinanceAlert(
    propertyId: string,
    subscriberId: string,
    monthlySavings: number,
    lifetimeSavings: number
  ): Promise<void> {
    // Check if alert already exists in last 30 days
    const recentAlert = await db.propertyAlert.findFirst({
      where: {
        propertyId,
        type: 'REFINANCE_OPPORTUNITY',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (recentAlert) {
      logger.info(`Refinance alert already exists for property ${propertyId}`);
      return;
    }

    await db.propertyAlert.create({
      data: {
        propertyId,
        subscriberId,
        type: 'REFINANCE_OPPORTUNITY',
        severity: 'WARNING',
        title: 'Refinancing Could Save You Money',
        message: `Based on current rates, you could save $${Math.round(monthlySavings)} per month (${Math.round(lifetimeSavings).toLocaleString()} total) by refinancing your mortgage.`,
        triggerValue: monthlySavings,
        status: 'ACTIVE',
        metadata: {
          monthlySavings,
          lifetimeSavings
        }
      }
    });

    logger.info(`Created refinance alert for property ${propertyId}`);
  }

  /**
   * Batch create financial snapshots for multiple properties
   */
  async batchCreateSnapshots(propertyIds: string[]): Promise<void> {
    logger.info(`Starting batch financial snapshot creation for ${propertyIds.length} properties`);

    for (const propertyId of propertyIds) {
      try {
        await this.createFinancialSnapshot(propertyId);
      } catch (error) {
        logger.error(`Failed to create snapshot for property ${propertyId}:`, error);
      }
    }

    logger.info(`Completed batch financial snapshot creation`);
  }
}

// Export singleton instance
export const financialService = new FinancialService();
