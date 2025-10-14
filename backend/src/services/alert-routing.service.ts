/**
 * Alert Routing Service
 * Intelligent alert routing and prioritization system for agent assignment
 * Features:
 * - Confidence-based ranking (higher confidence = higher priority)
 * - Territory-based routing (geographic assignment)
 * - Skill-based routing (match alert type to agent expertise)
 * - Round-robin distribution for load balancing
 * - Workload awareness (prevent agent overload)
 * - Alert assignment tracking
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { redis } from '../config/redis';

const logger = createLogger('alert-routing');
const db = new PrismaClient();

/**
 * Routing rule structure
 */
export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains' | 'regex';
  value: any;
}

export interface RuleAction {
  type: 'assign_to_agent' | 'assign_to_territory' | 'assign_by_skill' | 'escalate' | 'notify';
  params: Record<string, any>;
}

/**
 * Agent availability and workload
 */
export interface AgentWorkload {
  agentId: string;
  activeAlerts: number;
  maxConcurrentAlerts: number;
  availableCapacity: number;
  territories: string[];
  skills: string[];
  lastAssignedAt?: Date;
}

/**
 * Routing context for decision making
 */
export interface RoutingContext {
  alertId: string;
  userId: string;
  alertType: string;
  confidence: number;
  priority: string;
  territory?: string;
  metadata?: Record<string, any>;
}

/**
 * Routing result
 */
export interface RoutingResult {
  alertId: string;
  agentId: string;
  assignmentReason: string;
  confidence: number;
  routingStrategy: string;
}

export class AlertRoutingService {
  private readonly REDIS_ROUTING_RULES_KEY = 'alert:routing:rules';
  private readonly REDIS_AGENT_WORKLOAD_KEY = 'alert:agent:workload';
  private readonly DEFAULT_MAX_CONCURRENT_ALERTS = 10;

  /**
   * Route alert to appropriate agent
   * Main routing logic that evaluates rules and assigns alerts
   */
  async routeAlert(context: RoutingContext): Promise<RoutingResult> {
    try {
      logger.info(`Routing alert ${context.alertId} for user ${context.userId}`);

      // Get routing rules (from cache or database)
      const rules = await this.getRoutingRules();

      // Evaluate rules in priority order
      for (const rule of rules) {
        if (!rule.enabled) continue;

        const matches = this.evaluateRule(rule, context);
        if (matches) {
          logger.info(`Rule '${rule.name}' matched for alert ${context.alertId}`);

          // Execute rule actions
          const result = await this.executeRuleActions(rule, context);
          if (result) {
            return result;
          }
        }
      }

      // Fallback: Use default routing strategy
      logger.info(`No rules matched for alert ${context.alertId}, using default routing`);
      return await this.defaultRouting(context);
    } catch (error: any) {
      logger.error(`Failed to route alert ${context.alertId}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate if a rule matches the routing context
   */
  private evaluateRule(rule: RoutingRule, context: RoutingContext): boolean {
    try {
      // All conditions must be satisfied
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error(`Failed to evaluate rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: RuleCondition, context: RoutingContext): boolean {
    const contextValue = this.getContextValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(contextValue));
      default:
        logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Get value from context based on field path
   */
  private getContextValue(field: string, context: RoutingContext): any {
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Execute rule actions to assign alert
   */
  private async executeRuleActions(
    rule: RoutingRule,
    context: RoutingContext
  ): Promise<RoutingResult | null> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case 'assign_to_agent':
            return await this.assignToSpecificAgent(context, action.params.agentId, 'rule_based');

          case 'assign_to_territory':
            return await this.assignByTerritory(context, action.params.territory);

          case 'assign_by_skill':
            return await this.assignBySkill(context, action.params.requiredSkills);

          case 'escalate':
            // Escalate to supervisor or manager
            logger.info(`Escalating alert ${context.alertId}`);
            return await this.escalateAlert(context);

          case 'notify':
            // Send notification to agent/team
            logger.info(`Sending notification for alert ${context.alertId}`);
            // Notification logic would be implemented here
            break;

          default:
            logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        logger.error(`Failed to execute action ${action.type}:`, error);
      }
    }

    return null;
  }

  /**
   * Default routing strategy (confidence-based with round-robin)
   */
  private async defaultRouting(context: RoutingContext): Promise<RoutingResult> {
    // Get available agents
    const agents = await this.getAvailableAgents();

    if (agents.length === 0) {
      throw new Error('No agents available for assignment');
    }

    // Filter agents with available capacity
    const availableAgents = agents.filter(a => a.availableCapacity > 0);

    if (availableAgents.length === 0) {
      // All agents at capacity, find agent with lowest workload
      const leastBusyAgent = agents.reduce((prev, curr) =>
        prev.activeAlerts < curr.activeAlerts ? prev : curr
      );

      logger.warn(`All agents at capacity, assigning to least busy agent ${leastBusyAgent.agentId}`);
      return await this.assignToSpecificAgent(context, leastBusyAgent.agentId, 'overflow_assignment');
    }

    // Round-robin among available agents
    const agent = availableAgents[Math.floor(Math.random() * availableAgents.length)];

    return await this.assignToSpecificAgent(context, agent.agentId, 'round_robin');
  }

  /**
   * Assign alert to specific agent
   */
  private async assignToSpecificAgent(
    context: RoutingContext,
    agentId: string,
    strategy: string
  ): Promise<RoutingResult> {
    try {
      // Update alert with agent assignment
      await db.alertScore.update({
        where: { id: context.alertId },
        data: {
          assignedAgentId: agentId,
          assignedAt: new Date(),
          assignmentStrategy: strategy
        }
      });

      // Update agent workload
      await this.incrementAgentWorkload(agentId);

      logger.info(`Assigned alert ${context.alertId} to agent ${agentId} using ${strategy}`);

      return {
        alertId: context.alertId,
        agentId,
        assignmentReason: `Assigned via ${strategy}`,
        confidence: context.confidence,
        routingStrategy: strategy
      };
    } catch (error: any) {
      logger.error(`Failed to assign alert to agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Assign alert based on territory
   */
  private async assignByTerritory(
    context: RoutingContext,
    territory?: string
  ): Promise<RoutingResult> {
    const targetTerritory = territory || context.territory;

    if (!targetTerritory) {
      logger.warn('No territory specified, falling back to default routing');
      return await this.defaultRouting(context);
    }

    // Get agents assigned to this territory
    const agents = await this.getAgentsByTerritory(targetTerritory);

    if (agents.length === 0) {
      logger.warn(`No agents found for territory ${targetTerritory}, falling back to default routing`);
      return await this.defaultRouting(context);
    }

    // Select agent with lowest workload in territory
    const agent = agents.reduce((prev, curr) =>
      prev.activeAlerts < curr.activeAlerts ? prev : curr
    );

    return await this.assignToSpecificAgent(context, agent.agentId, 'territory_based');
  }

  /**
   * Assign alert based on agent skills
   */
  private async assignBySkill(
    context: RoutingContext,
    requiredSkills: string[]
  ): Promise<RoutingResult> {
    // Get agents with required skills
    const agents = await this.getAgentsBySkills(requiredSkills);

    if (agents.length === 0) {
      logger.warn(`No agents found with skills ${requiredSkills.join(', ')}, falling back to default routing`);
      return await this.defaultRouting(context);
    }

    // Prioritize by confidence score and workload
    const sortedAgents = agents.sort((a, b) => {
      // Lower workload = higher priority
      return a.activeAlerts - b.activeAlerts;
    });

    const agent = sortedAgents[0];

    return await this.assignToSpecificAgent(context, agent.agentId, 'skill_based');
  }

  /**
   * Escalate alert to supervisor/manager
   */
  private async escalateAlert(context: RoutingContext): Promise<RoutingResult> {
    // Get supervisors/managers (users with elevated permissions)
    const supervisors = await db.user.findMany({
      where: {
        role: { in: ['ADMIN', 'COMPANY_ADMIN'] },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    if (supervisors.length === 0) {
      logger.warn('No supervisors available, falling back to default routing');
      return await this.defaultRouting(context);
    }

    // Round-robin among supervisors
    const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];

    return await this.assignToSpecificAgent(context, supervisor.id, 'escalated');
  }

  /**
   * Get available agents with their workload
   */
  async getAvailableAgents(): Promise<AgentWorkload[]> {
    try {
      // Try to get from cache first
      const cached = await redis.get(`${this.REDIS_AGENT_WORKLOAD_KEY}:all`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get active agents from database
      const agents = await db.user.findMany({
        where: {
          role: 'AGENT',
          status: 'ACTIVE'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      // Calculate workload for each agent
      const workloads: AgentWorkload[] = await Promise.all(
        agents.map(async (agent) => {
          const activeAlerts = await db.alertScore.count({
            where: {
              assignedAgentId: agent.id,
              status: { in: ['PENDING', 'ACKNOWLEDGED'] }
            }
          });

          // Get agent settings from user metadata (if stored)
          const maxConcurrentAlerts = this.DEFAULT_MAX_CONCURRENT_ALERTS;

          return {
            agentId: agent.id,
            activeAlerts,
            maxConcurrentAlerts,
            availableCapacity: Math.max(0, maxConcurrentAlerts - activeAlerts),
            territories: [], // Would be populated from agent profile
            skills: [] // Would be populated from agent profile
          };
        })
      );

      // Cache for 1 minute
      await redis.setex(
        `${this.REDIS_AGENT_WORKLOAD_KEY}:all`,
        60,
        JSON.stringify(workloads)
      );

      return workloads;
    } catch (error: any) {
      logger.error('Failed to get available agents:', error);
      throw error;
    }
  }

  /**
   * Get agents by territory
   */
  private async getAgentsByTerritory(territory: string): Promise<AgentWorkload[]> {
    const allAgents = await this.getAvailableAgents();
    return allAgents.filter(agent => agent.territories.includes(territory));
  }

  /**
   * Get agents by skills
   */
  private async getAgentsBySkills(skills: string[]): Promise<AgentWorkload[]> {
    const allAgents = await this.getAvailableAgents();
    return allAgents.filter(agent =>
      skills.every(skill => agent.skills.includes(skill))
    );
  }

  /**
   * Get agent workload
   */
  async getAgentWorkload(agentId: string): Promise<AgentWorkload | null> {
    try {
      const agents = await this.getAvailableAgents();
      return agents.find(a => a.agentId === agentId) || null;
    } catch (error: any) {
      logger.error(`Failed to get agent workload for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Increment agent workload (after assignment)
   */
  private async incrementAgentWorkload(agentId: string): Promise<void> {
    try {
      // Invalidate cache to force refresh
      await redis.del(`${this.REDIS_AGENT_WORKLOAD_KEY}:all`);
      logger.info(`Invalidated workload cache after assigning alert to agent ${agentId}`);
    } catch (error) {
      logger.error('Failed to invalidate workload cache:', error);
    }
  }

  /**
   * Reassign alert to different agent
   */
  async reassignAlert(
    alertId: string,
    newAgentId: string,
    reason: string
  ): Promise<RoutingResult> {
    try {
      // Get alert details
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        select: {
          userId: true,
          alertType: true,
          confidence: true,
          priority: true,
          assignedAgentId: true
        }
      });

      if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
      }

      // Update alert assignment
      await db.alertScore.update({
        where: { id: alertId },
        data: {
          assignedAgentId: newAgentId,
          assignedAt: new Date(),
          assignmentStrategy: 'manual_reassignment',
          reassignmentReason: reason
        }
      });

      // Update workload caches
      if (alert.assignedAgentId) {
        await this.incrementAgentWorkload(alert.assignedAgentId);
      }
      await this.incrementAgentWorkload(newAgentId);

      logger.info(`Reassigned alert ${alertId} from ${alert.assignedAgentId} to ${newAgentId}`);

      return {
        alertId,
        agentId: newAgentId,
        assignmentReason: reason,
        confidence: alert.confidence,
        routingStrategy: 'manual_reassignment'
      };
    } catch (error: any) {
      logger.error(`Failed to reassign alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk assign alerts
   */
  async bulkAssignAlerts(alertIds: string[]): Promise<RoutingResult[]> {
    const results: RoutingResult[] = [];

    for (const alertId of alertIds) {
      try {
        const alert = await db.alertScore.findUnique({
          where: { id: alertId },
          select: {
            userId: true,
            alertType: true,
            confidence: true,
            priority: true
          }
        });

        if (!alert) {
          logger.warn(`Alert ${alertId} not found, skipping`);
          continue;
        }

        const context: RoutingContext = {
          alertId,
          userId: alert.userId,
          alertType: alert.alertType,
          confidence: alert.confidence,
          priority: alert.priority
        };

        const result = await this.routeAlert(context);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to bulk assign alert ${alertId}:`, error);
      }
    }

    logger.info(`Bulk assigned ${results.length} of ${alertIds.length} alerts`);
    return results;
  }

  /**
   * Get routing rules from cache or database
   */
  async getRoutingRules(): Promise<RoutingRule[]> {
    try {
      // Try cache first
      const cached = await redis.get(this.REDIS_ROUTING_RULES_KEY);
      if (cached) {
        return JSON.parse(cached);
      }

      // Load from database
      const rules = await db.routingRule.findMany({
        where: { enabled: true },
        orderBy: { priority: 'desc' }
      });

      // Transform to RoutingRule format
      const routingRules: RoutingRule[] = rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        priority: rule.priority,
        enabled: rule.enabled,
        conditions: rule.conditions as RuleCondition[],
        actions: rule.actions as RuleAction[]
      }));

      // Cache for 5 minutes
      await redis.setex(
        this.REDIS_ROUTING_RULES_KEY,
        300,
        JSON.stringify(routingRules)
      );

      return routingRules;
    } catch (error: any) {
      logger.error('Failed to get routing rules:', error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Update routing rules cache
   */
  async refreshRoutingRulesCache(): Promise<void> {
    try {
      await redis.del(this.REDIS_ROUTING_RULES_KEY);
      await this.getRoutingRules();
      logger.info('Routing rules cache refreshed');
    } catch (error) {
      logger.error('Failed to refresh routing rules cache:', error);
      throw error;
    }
  }

  /**
   * Handle stale alerts (unacknowledged for too long)
   */
  async handleStaleAlerts(maxAgeDays: number = 3): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const staleAlerts = await db.alertScore.findMany({
        where: {
          status: 'PENDING',
          assignedAt: { lt: cutoffDate }
        },
        select: {
          id: true,
          userId: true,
          alertType: true,
          confidence: true,
          priority: true,
          assignedAgentId: true
        }
      });

      logger.info(`Found ${staleAlerts.length} stale alerts to escalate`);

      for (const alert of staleAlerts) {
        try {
          const context: RoutingContext = {
            alertId: alert.id,
            userId: alert.userId,
            alertType: alert.alertType,
            confidence: alert.confidence,
            priority: alert.priority
          };

          // Escalate to supervisor
          await this.escalateAlert(context);
        } catch (error) {
          logger.error(`Failed to escalate stale alert ${alert.id}:`, error);
        }
      }
    } catch (error: any) {
      logger.error('Failed to handle stale alerts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertRoutingService = new AlertRoutingService();
