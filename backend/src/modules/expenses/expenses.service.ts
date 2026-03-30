import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, FindManyOptions } from 'typeorm'
import { ExpenseEntry }    from './expense-entry.entity'
import { ExpenseCategory } from './expense-category.enum'

interface CreateExpenseDto { budgetId: string; category: ExpenseCategory; amount: number; description?: string; expenseDate: string }
interface UpdateExpenseDto { category?: ExpenseCategory; amount?: number; description?: string; expenseDate?: string }
interface ListExpenseParams { budgetId?: string; category?: ExpenseCategory; search?: string; cursor?: string; limit?: number }

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(ExpenseEntry) private repo: Repository<ExpenseEntry>) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const entry = this.repo.create({
      category:    dto.category,
      amount:      dto.amount,
      description: dto.description,
      expenseDate: dto.expenseDate,
      budget: { id: dto.budgetId } as any,
    })
    return this.repo.save(entry)
  }

  async findAll(params: ListExpenseParams) {
    const where: any = {}
    if (params.budgetId) where.budget = { id: params.budgetId }
    if (params.category) where.category = params.category
    if (params.search)   where.description = Like(`%${params.search}%`)

    const limit = params.limit || 50
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { expenseDate: 'DESC', createdAt: 'DESC' },
      take:  limit,
    })
    return { items, total }
  }

  async update(id: string, dto: UpdateExpenseDto) {
    const entry = await this.repo.findOne({ where: { id } })
    if (!entry) throw new NotFoundException('Expense not found')
    Object.assign(entry, dto)
    return this.repo.save(entry)
  }

  async delete(id: string) {
    const entry = await this.repo.findOne({ where: { id } })
    if (!entry) throw new NotFoundException('Expense not found')
    await this.repo.remove(entry)
    return { message: 'Expense deleted' }
  }
}
