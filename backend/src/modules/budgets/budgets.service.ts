import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }       from 'typeorm'
import { Budget }           from './budget.entity'
import { BudgetRule }       from './budget-rule.entity'
import { IncomeSource }     from '../income/income-source.entity'

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)       private budgets:  Repository<Budget>,
    @InjectRepository(IncomeSource) private income:   Repository<IncomeSource>,
    @InjectRepository(BudgetRule)   private budgetRules: Repository<BudgetRule>,
  ) {}

  async create(userId: string, dto: { 
    month: string; 
    initialIncome: number; 
    initialSource: string;
    budgetRuleId?: string;
    customNeedsPercentage?: number;
    customWantsPercentage?: number;
    customSavingsPercentage?: number;
  }) {
    // Get the budget rule (use default if not specified)
    let budgetRule: BudgetRule
    if (dto.budgetRuleId) {
      budgetRule = await this.budgetRules.findOne({ where: { id: dto.budgetRuleId } })
      if (!budgetRule) {
        throw new NotFoundException('Budget rule not found')
      }
    } else {
      budgetRule = await this.budgetRules.findOne({ where: { isDefault: true } })
      if (!budgetRule) {
        throw new NotFoundException('Default budget rule not found')
      }
    }

    // Calculate allocations using the rule or custom percentages
    let allocations
    if (dto.customNeedsPercentage || dto.customWantsPercentage || dto.customSavingsPercentage) {
      // Use custom percentages
      const needsPct = dto.customNeedsPercentage ?? budgetRule.needsPercentage
      const wantsPct = dto.customWantsPercentage ?? budgetRule.wantsPercentage
      const savingsPct = dto.customSavingsPercentage ?? budgetRule.savingsPercentage

      // Validate percentages sum to 100
      const total = needsPct + wantsPct + savingsPct
      if (Math.abs(total - 100) > 0.01) {
        throw new BadRequestException('Percentages must sum to 100%')
      }

      allocations = {
        needsBudget: round2(dto.initialIncome * (needsPct / 100)),
        wantsBudget: round2(dto.initialIncome * (wantsPct / 100)),
        savingsBudget: round2(dto.initialIncome * (savingsPct / 100))
      }
    } else {
      // Use rule percentages
      allocations = {
        needsBudget: round2(dto.initialIncome * (budgetRule.needsPercentage / 100)),
        wantsBudget: round2(dto.initialIncome * (budgetRule.wantsPercentage / 100)),
        savingsBudget: round2(dto.initialIncome * (budgetRule.savingsPercentage / 100))
      }
    }

    const budget = this.budgets.create({
      month: dto.month,
      totalIncome: dto.initialIncome,
      needsBudget: allocations.needsBudget,
      wantsBudget: allocations.wantsBudget,
      savingsBudget: allocations.savingsBudget,
      budgetRuleId: dto.budgetRuleId,
      customNeedsPercentage: dto.customNeedsPercentage,
      customWantsPercentage: dto.customWantsPercentage,
      customSavingsPercentage: dto.customSavingsPercentage,
      isActive: true,
      user: { id: userId } as any,
    })
    const saved = await this.budgets.save(budget)

    // Create initial income source
    const src = this.income.create({ sourceName: dto.initialSource, amount: dto.initialIncome, budget: saved })
    await this.income.save(src)

    return this.budgets.findOne({ where: { id: saved.id }, relations: ['incomeSources', 'budgetRule'] })
  }

  async findAll(userId: string) {
    return this.budgets.find({
      where: { user: { id: userId } },
      order: { month: 'DESC' },
      relations: ['incomeSources', 'budgetRule'],
    })
  }

  async findOne(id: string, userId: string) {
    const b = await this.budgets.findOne({ where: { id, user: { id: userId } }, relations: ['incomeSources', 'budgetRule'] })
    if (!b) throw new NotFoundException('Budget not found')
    return b
  }

  async delete(id: string, userId: string) {
    const b = await this.findOne(id, userId)
    await this.budgets.remove(b)
    return { message: 'Budget deleted' }
  }

  /** Recalculate totalIncome + 50/30/20 after income source changes */
  async recalculate(budgetId: string) {
    const sources = await this.income.find({ where: { budget: { id: budgetId } } })
    const total   = sources.reduce((s, i) => s + Number(i.amount), 0)
    await this.budgets.update(budgetId, {
      totalIncome:  total,
      needsBudget:   round2(total * 0.50),
      wantsBudget:   round2(total * 0.30),
      savingsBudget: round2(total * 0.20),
    })
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
