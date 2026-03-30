import { Controller, Get, Param, Query, UseGuards, Request, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation }                   from '@nestjs/swagger'
import { Response }     from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** GET /api/v1/analytics/summary/:budgetId — computeSummary() endpoint */
  @Get('summary/:budgetId')
  @ApiOperation({ summary: 'Get computed budget summary (all 19 formulas)' })
  async summary(@Param('budgetId') id: string, @Request() req: any) {
    return this.analytics.computeSummary(id, req.user.id)
  }

  /** GET /api/v1/analytics/history?months=12 */
  @Get('history')
  @ApiOperation({ summary: 'Get multi-month spending history for 3D bar chart' })
  async history(@Request() req: any, @Query('months') months = 12) {
    return this.analytics.getHistory(req.user.id, Number(months))
  }

  @Get('export/:budgetId')
  @ApiOperation({ summary: 'Export budget data as CSV, JSON, or EXCEL' })
  async export(
    @Param('budgetId') id: string,
    @Query('format') format: 'csv' | 'json' | 'xlsx' = 'json',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { budget, summary, expenses } = await this.analytics.exportData(id, req.user.id)

    if (format === 'csv') {
      const rows = [
        ['Date', 'Category', 'Amount', 'Description'],
        ...expenses.map(e => [e.expenseDate, e.category, e.amount, e.description ?? '']),
      ]
      const csv = rows.map(r => r.map(String).join(',')).join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="budget-${id}.csv"`)
      return res.send(csv)
    }

    if (format === 'xlsx') {
      const xlsx = require('xlsx')
      const wb = xlsx.utils.book_new()
      
      const summarySheet = xlsx.utils.json_to_sheet([
        { Metric: 'Total Income', Value: summary.totalIncome },
        { Metric: 'Needs Budget', Value: summary.needsBudget },
        { Metric: 'Wants Budget', Value: summary.wantsBudget },
        { Metric: 'Savings Budget', Value: summary.savingsBudget },
        { Metric: 'Total Spent', Value: summary.totalSpent },
        { Metric: 'Surplus/Deficit', Value: summary.surplusDeficit }
      ])
      xlsx.utils.book_append_sheet(wb, summarySheet, 'Summary')

      const expensesSheet = xlsx.utils.json_to_sheet(
        expenses.map(e => ({ Date: e.expenseDate, Category: e.category, Amount: e.amount, Description: e.description }))
      )
      xlsx.utils.book_append_sheet(wb, expensesSheet, 'Expenses')

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="budget-${id}.xlsx"`)
      return res.send(buffer)
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="budget-${id}.json"`)
    return res.send(JSON.stringify({ budget, summary, expenses }, null, 2))
  }
}
