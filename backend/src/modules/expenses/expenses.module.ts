import { Module }        from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ExpensesController } from './expenses.controller'
import { ExpensesService }    from './expenses.service'
import { ExpenseEntry }       from './expense-entry.entity'

@Module({
  imports:     [TypeOrmModule.forFeature([ExpenseEntry])],
  controllers: [ExpensesController],
  providers:   [ExpensesService],
  exports:     [ExpensesService],
})
export class ExpensesModule {}
