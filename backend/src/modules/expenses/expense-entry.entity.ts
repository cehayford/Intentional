import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Budget }           from '../budgets/budget.entity'
import { ExpenseCategory }  from './expense-category.enum'

@Entity('expense_entries')
export class ExpenseEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: ExpenseCategory })
  category: ExpenseCategory

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => Budget, b => b.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget
}
