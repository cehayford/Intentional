import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }       from 'typeorm'
import { Budget }           from './budget.entity'
import { IncomeSource }     from '../income/income-source.entity'

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)       private budgets:  Repository<Budget>,
    @InjectRepository(IncomeSource) private income:   Repository<IncomeSource>,
  ) {}

  async create(userId: string, dto: { 
    month: string; 
    initialIncome: number; 
    initialSource: string;
    customNeedsPercentage?: number;
    customWantsPercentage?: number;
    customSavingsPercentage?: number;
  }) {
    // Default percentages if not provided
    const needsPct = dto.customNeedsPercentage ?? 50
    const wantsPct = dto.customWantsPercentage ?? 30
    const savingsPct = dto.customSavingsPercentage ?? 20

    // Validate percentages sum to 100
    const total = needsPct + wantsPct + savingsPct
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Percentages must sum to 100%')
    }

    const allocations = {
      needsBudget: round2(dto.initialIncome * (needsPct / 100)),
      wantsBudget: round2(dto.initialIncome * (wantsPct / 100)),
      savingsBudget: round2(dto.initialIncome * (savingsPct / 100))
    }

    const budget = this.budgets.create({
      month: dto.month,
      totalIncome: dto.initialIncome,
      needsBudget: allocations.needsBudget,
      wantsBudget: allocations.wantsBudget,
      savingsBudget: allocations.savingsBudget,
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

    return this.budgets.findOne({ where: { id: saved.id }, relations: ['incomeSources'] })
  }

  async findAll(userId: string) {
    return this.budgets.find({
      where: { user: { id: userId } },
      order: { month: 'DESC' },
      relations: ['incomeSources'],
    })
  }

  async findOne(id: string, userId: string) {
    const b = await this.budgets.findOne({ where: { id, user: { id: userId } }, relations: ['incomeSources'] })
    if (!b) throw new NotFoundException('Budget not found')
    return b
  }

  async delete(id: string, userId: string) {
    const b = await this.findOne(id, userId)
    await this.budgets.remove(b)
    return { message: 'Budget deleted' }
  }

  /** Recalculate totalIncome + allocations after income source changes */
  async recalculate(budgetId: string) {
    const budget = await this.budgets.findOne({ where: { id: budgetId } })
    if (!budget) throw new NotFoundException('Budget not found')
    
    const sources = await this.income.find({ where: { budget: { id: budgetId } } })
    const total   = sources.reduce((s, i) => s + Number(i.amount), 0)
    
    // Use custom percentages if available, otherwise default to 50/30/20
    const needsPct = budget.customNeedsPercentage ?? 50
    const wantsPct = budget.customWantsPercentage ?? 30
    const savingsPct = budget.customSavingsPercentage ?? 20
    
    await this.budgets.update(budgetId, {
      totalIncome:  total,
      needsBudget:   round2(total * (needsPct / 100)),
      wantsBudget:   round2(total * (wantsPct / 100)),
      savingsBudget: round2(total * (savingsPct / 100)),
    })
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
