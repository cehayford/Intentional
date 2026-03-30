import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }       from 'typeorm'
import { Budget }           from '../budgets/budget.entity'
import { ExpenseEntry }     from '../expenses/expense-entry.entity'
import { ExpenseCategory }  from '../expenses/expense-category.enum'

/**
 * BudgetSummary — replicates all 19 formulas from Nischa's spreadsheet.
 * Formula parity target: ±0.01 (PRD §11 – NFR Reliability).
 */
export interface BudgetSummary {
  budgetId:         string
  // Income
  totalIncome:      number   // F1: SUM(income_sources.amount)
  // Budgets (50/30/20)
  needsBudget:      number   // F2: totalIncome × 0.50
  wantsBudget:      number   // F3: totalIncome × 0.30
  savingsBudget:    number   // F4: totalIncome × 0.20
  // Spent per category
  needsSpent:       number   // F5: SUM(expenses WHERE category='NEED')
  wantsSpent:       number   // F6: SUM(expenses WHERE category='WANT')
  savingsSpent:     number   // F7: SUM(expenses WHERE category='SAVINGS')
  // Remaining per category
  needsRemaining:   number   // F8:  needsBudget   – needsSpent
  wantsRemaining:   number   // F9:  wantsBudget   – wantsSpent
  savingsRemaining: number   // F10: savingsBudget – savingsSpent
  // Totals
  totalSpent:       number   // F11: needsSpent + wantsSpent + savingsSpent
  totalRemaining:   number   // F12: totalIncome – totalSpent
  surplusDeficit:   number   // F13: totalRemaining (>0 surplus, <0 deficit)
  // Percentages of income (actual)
  needsPercentage:  number   // F14: (needsSpent   / totalIncome) × 100
  wantsPercentage:  number   // F15: (wantsSpent   / totalIncome) × 100
  savingsPercentage:number   // F16: (savingsSpent / totalIncome) × 100
  // Budget utilisation %
  needsUtilisation:  number  // F17: (needsSpent   / needsBudget)   × 100
  wantsUtilisation:  number  // F18: (wantsSpent   / wantsBudget)   × 100
  savingsUtilisation:number  // F19: (savingsSpent / savingsBudget) × 100
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Budget)       private budgets:  Repository<Budget>,
    @InjectRepository(ExpenseEntry) private expenses: Repository<ExpenseEntry>,
  ) {}

  /**
   * Core formula engine — computeSummary()
   * Replicates all 19 spreadsheet formulas server-side.
   * Precision guarded: all arithmetic rounded to ±0.01.
   */
  async computeSummary(budgetId: string, userId: string): Promise<BudgetSummary> {
    const budget = await this.budgets.findOne({
      where: { id: budgetId, user: { id: userId } },
      relations: ['incomeSources'],
    })
    if (!budget) throw new NotFoundException('Budget not found')

    const expenseRows = await this.expenses.find({ where: { budget: { id: budgetId } } })

    // ── Formula F1: Total Income
    const totalIncome = expenseRows.reduce((_, __) => _, 0) // placeholder; see income path below
    const incomeTotal = budget.incomeSources.reduce((sum, s) => sum + Number(s.amount), 0)

    // ── Formulas F2–F4: 50/30/20 Allocations
    const needsBudget   = round2(incomeTotal * 0.50)
    const wantsBudget   = round2(incomeTotal * 0.30)
    const savingsBudget = round2(incomeTotal * 0.20)

    // ── Formulas F5–F7: Category Totals
    const needsSpent   = round2(sumWhere(expenseRows, ExpenseCategory.NEED))
    const wantsSpent   = round2(sumWhere(expenseRows, ExpenseCategory.WANT))
    const savingsSpent = round2(sumWhere(expenseRows, ExpenseCategory.SAVINGS))

    // ── Formulas F8–F10: Remaining
    const needsRemaining   = round2(needsBudget   - needsSpent)
    const wantsRemaining   = round2(wantsBudget   - wantsSpent)
    const savingsRemaining = round2(savingsBudget - savingsSpent)

    // ── Formula F11: Total Spent
    const totalSpent = round2(needsSpent + wantsSpent + savingsSpent)

    // ── Formula F12: Total Remaining
    const totalRemaining = round2(incomeTotal - totalSpent)

    // ── Formula F13: Surplus / Deficit
    const surplusDeficit = totalRemaining  // positive = surplus, negative = deficit

    // ── Formulas F14–F16: % of Income (actual spend rate)
    const needsPercentage   = pct(needsSpent,   incomeTotal)
    const wantsPercentage   = pct(wantsSpent,   incomeTotal)
    const savingsPercentage = pct(savingsSpent,  incomeTotal)

    // ── Formulas F17–F19: Budget Utilisation
    const needsUtilisation   = pct(needsSpent,   needsBudget)
    const wantsUtilisation   = pct(wantsSpent,   wantsBudget)
    const savingsUtilisation = pct(savingsSpent,  savingsBudget)

    return {
      budgetId,
      totalIncome:      incomeTotal,
      needsBudget, wantsBudget, savingsBudget,
      needsSpent, wantsSpent, savingsSpent,
      needsRemaining, wantsRemaining, savingsRemaining,
      totalSpent, totalRemaining, surplusDeficit,
      needsPercentage, wantsPercentage, savingsPercentage,
      needsUtilisation, wantsUtilisation, savingsUtilisation,
    }
  }

  /**
   * Multi-month history for the 3D bar chart (12 months)
   */
  async getHistory(userId: string, months = 12): Promise<any[]> {
    const budgets = await this.budgets.find({
      where: { user: { id: userId } },
      order: { month: 'DESC' },
      take: months,
      relations: ['incomeSources'],
    })

    const results = await Promise.all(
      budgets.map(async (b) => {
        const exps = await this.expenses.find({ where: { budget: { id: b.id } } })
        return {
          budgetId:     b.id,
          label:        new Date(b.month).toLocaleString('default', { month: 'short', year: '2-digit' }),
          totalIncome:  b.incomeSources.reduce((s, i) => s + Number(i.amount), 0),
          needsSpent:   round2(sumWhere(exps, ExpenseCategory.NEED)),
          wantsSpent:   round2(sumWhere(exps, ExpenseCategory.WANT)),
          savingsSpent: round2(sumWhere(exps, ExpenseCategory.SAVINGS)),
        }
      })
    )
    return results.reverse()  // chronological order
  }

  /**
   * Export budget data as flat records (caller decides format)
   */
  async exportData(budgetId: string, userId: string) {
    const budget = await this.budgets.findOne({
      where: { id: budgetId, user: { id: userId } },
      relations: ['incomeSources'],
    })
    if (!budget) throw new NotFoundException('Budget not found')

    const expenses = await this.expenses.find({ where: { budget: { id: budgetId } }, order: { expenseDate: 'ASC' } })
    const summary  = await this.computeSummary(budgetId, userId)

    return { budget, summary, expenses }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function round2(n: number): number { return Math.round(n * 100) / 100 }
function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return round2((numerator / denominator) * 100)
}
function sumWhere(entries: ExpenseEntry[], category: ExpenseCategory): number {
  return entries
    .filter(e => e.category === category)
    .reduce((sum, e) => sum + Number(e.amount), 0)
}
