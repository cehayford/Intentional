import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }       from 'typeorm'
import { IncomeSource }     from './income-source.entity'
import { BudgetsService }   from '../budgets/budgets.service'

@Injectable()
export class IncomeService {
  constructor(
    @InjectRepository(IncomeSource) private repo: Repository<IncomeSource>,
    private budgets: BudgetsService,
  ) {}

  async add(dto: { budgetId: string; sourceName: string; amount: number }) {
    const src = this.repo.create({ sourceName: dto.sourceName, amount: dto.amount, budget: { id: dto.budgetId } as any })
    const saved = await this.repo.save(src)
    await this.budgets.recalculate(dto.budgetId)
    return saved
  }

  async update(id: string, dto: { sourceName?: string; amount?: number }) {
    const src = await this.repo.findOne({ where: { id }, relations: ['budget'] })
    if (!src) throw new NotFoundException('Income source not found')
    Object.assign(src, dto)
    await this.repo.save(src)
    await this.budgets.recalculate(src.budget.id)
    return src
  }

  async delete(id: string) {
    const src = await this.repo.findOne({ where: { id }, relations: ['budget'] })
    if (!src) throw new NotFoundException('Income source not found')
    const budgetId = src.budget.id
    await this.repo.remove(src)
    await this.budgets.recalculate(budgetId)
    return { message: 'Income source removed' }
  }
}
