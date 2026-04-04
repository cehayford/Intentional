import { Module }        from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BudgetsController } from './budgets.controller'
import { BudgetsService }    from './budgets.service'
import { BudgetRuleController } from './budget-rule.controller'
import { BudgetRuleService }   from './budget-rule.service'
import { Budget }            from './budget.entity'
import { BudgetRule }        from './budget-rule.entity'
import { IncomeSource }      from '../income/income-source.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetRule, IncomeSource])],
  controllers: [BudgetsController, BudgetRuleController],
  providers:   [BudgetsService, BudgetRuleService],
  exports:     [BudgetsService, BudgetRuleService],
})
export class BudgetsModule {}
