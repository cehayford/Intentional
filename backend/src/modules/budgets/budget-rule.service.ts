import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BudgetRule } from './budget-rule.entity'

@Injectable()
export class BudgetRuleService {
  constructor(
    @InjectRepository(BudgetRule) private budgetRules: Repository<BudgetRule>,
  ) {}

  async createPredefinedRules() {
    const predefinedRules = [
      {
        name: '50/30/20 Standard',
        needsPercentage: 50.00,
        wantsPercentage: 30.00,
        savingsPercentage: 20.00,
        isDefault: true,
        isCustom: false,
        description: 'Balanced approach for stable financial situations',
        category: 'predefined'
      },
      {
        name: '65/25/10 High-Cost Areas',
        needsPercentage: 65.00,
        wantsPercentage: 25.00,
        savingsPercentage: 10.00,
        isDefault: false,
        isCustom: false,
        description: 'For expensive cities or lower income situations',
        category: 'predefined'
      },
      {
        name: '40/40/20 Savings Focus',
        needsPercentage: 40.00,
        wantsPercentage: 40.00,
        savingsPercentage: 20.00,
        isDefault: false,
        isCustom: false,
        description: 'Aggressive savings for financial goals',
        category: 'predefined'
      },
      {
        name: '70/20/10 Debt Reduction',
        needsPercentage: 70.00,
        wantsPercentage: 20.00,
        savingsPercentage: 10.00,
        isDefault: false,
        isCustom: false,
        description: 'Focus on debt repayment with minimal savings',
        category: 'predefined'
      }
    ]

    for (const ruleData of predefinedRules) {
      const existing = await this.budgetRules.findOne({
        where: { name: ruleData.name, user: null }
      })
      
      if (!existing) {
        const rule = this.budgetRules.create(ruleData)
        await this.budgetRules.save(rule)
      }
    }
  }

  async findAll(userId?: string) {
    // Get predefined rules (user = null)
    const predefinedRules = await this.budgetRules.find({
      where: { user: null },
      order: { isDefault: 'DESC', name: 'ASC' }
    })

    // Get user's custom rules if userId provided
    let customRules: BudgetRule[] = []
    if (userId) {
      customRules = await this.budgetRules.find({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' }
      })
    }

    return [...predefinedRules, ...customRules]
  }

  async findOne(id: string, userId?: string) {
    const rule = await this.budgetRules.findOne({
      where: { id },
      relations: ['user']
    })

    if (!rule) {
      throw new NotFoundException('Budget rule not found')
    }

    // Check if user has access to this rule
    if (rule.user && userId && rule.user.id !== userId) {
      throw new NotFoundException('Budget rule not found')
    }

    return rule
  }

  async createCustomRule(userId: string, data: {
    name: string
    needsPercentage: number
    wantsPercentage: number
    savingsPercentage: number
    description?: string
  }) {
    // Validate percentages sum to 100
    const total = data.needsPercentage + data.wantsPercentage + data.savingsPercentage
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Percentages must sum to 100%')
    }

    // Validate individual percentages
    if (data.needsPercentage < 0 || data.wantsPercentage < 0 || data.savingsPercentage < 0) {
      throw new BadRequestException('Percentages must be positive')
    }

    if (data.needsPercentage > 100 || data.wantsPercentage > 100 || data.savingsPercentage > 100) {
      throw new BadRequestException('Percentages cannot exceed 100%')
    }

    // Check for duplicate name
    const existing = await this.budgetRules.findOne({
      where: { name: data.name, user: { id: userId } }
    })

    if (existing) {
      throw new BadRequestException('A rule with this name already exists')
    }

    const rule = this.budgetRules.create({
      ...data,
      isCustom: true,
      isDefault: false,
      category: 'custom',
      user: { id: userId } as any
    })

    return this.budgetRules.save(rule)
  }

  async updateCustomRule(id: string, userId: string, data: {
    name?: string
    needsPercentage?: number
    wantsPercentage?: number
    savingsPercentage?: number
    description?: string
  }) {
    const rule = await this.findOne(id, userId)

    if (!rule.isCustom) {
      throw new BadRequestException('Cannot modify predefined rules')
    }

    // Validate percentages if provided
    if (data.needsPercentage !== undefined || data.wantsPercentage !== undefined || data.savingsPercentage !== undefined) {
      const needs = data.needsPercentage ?? rule.needsPercentage
      const wants = data.wantsPercentage ?? rule.wantsPercentage
      const savings = data.savingsPercentage ?? rule.savingsPercentage

      const total = needs + wants + savings
      if (Math.abs(total - 100) > 0.01) {
        throw new BadRequestException('Percentages must sum to 100%')
      }

      if (needs < 0 || wants < 0 || savings < 0) {
        throw new BadRequestException('Percentages must be positive')
      }

      if (needs > 100 || wants > 100 || savings > 100) {
        throw new BadRequestException('Percentages cannot exceed 100%')
      }
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== rule.name) {
      const existing = await this.budgetRules.findOne({
        where: { name: data.name, user: { id: userId } }
      })

      if (existing) {
        throw new BadRequestException('A rule with this name already exists')
      }
    }

    Object.assign(rule, data)
    return this.budgetRules.save(rule)
  }

  async deleteCustomRule(id: string, userId: string) {
    const rule = await this.findOne(id, userId)

    if (!rule.isCustom) {
      throw new BadRequestException('Cannot delete predefined rules')
    }

    // Check if rule is being used by any budgets
    const budgetsWithRule = await this.budgetRules
      .createQueryBuilder('rule')
      .leftJoin('rule.budgets', 'budget')
      .where('rule.id = :id', { id })
      .andWhere('budget.budget_rule_id IS NOT NULL')
      .getCount()

    if (budgetsWithRule > 0) {
      throw new BadRequestException('Cannot delete rule that is in use by budgets')
    }

    await this.budgetRules.remove(rule)
  }

  async getDefaultRule() {
    return this.budgetRules.findOne({
      where: { isDefault: true }
    })
  }

  calculateBudgetAllocations(income: number, rule: BudgetRule, customPercentages?: {
    needsPercentage?: number
    wantsPercentage?: number
    savingsPercentage?: number
  }) {
    // Use custom percentages if provided, otherwise use rule percentages
    const needsPct = customPercentages?.needsPercentage ?? rule.needsPercentage
    const wantsPct = customPercentages?.wantsPercentage ?? rule.wantsPercentage
    const savingsPct = customPercentages?.savingsPercentage ?? rule.savingsPercentage

    return {
      needsBudget: Math.round(income * (needsPct / 100) * 100) / 100,
      wantsBudget: Math.round(income * (wantsPct / 100) * 100) / 100,
      savingsBudget: Math.round(income * (savingsPct / 100) * 100) / 100
    }
  }
}
