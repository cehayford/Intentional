import { Module }          from '@nestjs/common'
import { TypeOrmModule }   from '@nestjs/typeorm'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService }    from './analytics.service'
import { Budget }              from '../budgets/budget.entity'
import { ExpenseEntry }        from '../expenses/expense-entry.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Budget, ExpenseEntry])],
  controllers: [AnalyticsController],
  providers:   [AnalyticsService],
  exports:     [AnalyticsService],
})
export class AnalyticsModule {}
