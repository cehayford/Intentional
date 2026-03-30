import { Injectable, NotFoundException } from '@nestjs/common'
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

  async create(userId: string, dto: { month: string; initialIncome: number; initialSource: string }) {
    // Compute 50/30/20 allocations
    const needsBudget   = round2(dto.initialIncome * 0.50)
    const wantsBudget   = round2(dto.initialIncome * 0.30)
    const savingsBudget = round2(dto.initialIncome * 0.20)

    const budget = this.budgets.create({
      month:       dto.month,
      totalIncome: dto.initialIncome,
      needsBudget, wantsBudget, savingsBudget,
      isActive:    true,
      user:        { id: userId } as any,
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
