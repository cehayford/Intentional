import { Module }        from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IncomeController } from './income.controller'
import { IncomeService }    from './income.service'
import { IncomeSource }     from './income-source.entity'
import { BudgetsModule }    from '../budgets/budgets.module'

@Module({
  imports:     [TypeOrmModule.forFeature([IncomeSource]), BudgetsModule],
  controllers: [IncomeController],
  providers:   [IncomeService],
})
export class IncomeModule {}
