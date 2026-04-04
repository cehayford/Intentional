import { Module }        from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BudgetsController } from './budgets.controller'
import { BudgetsService }    from './budgets.service'
import { Budget }            from './budget.entity'
import { IncomeSource }      from '../income/income-source.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Budget, IncomeSource])],
  controllers: [BudgetsController],
  providers:   [BudgetsService],
  exports:     [BudgetsService],
})
export class BudgetsModule {}
