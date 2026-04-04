import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm'
import { User }          from '../users/user.entity'
import { IncomeSource }  from '../income/income-source.entity'
import { ExpenseEntry }  from '../expenses/expense-entry.entity'

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'date' })
  month: string

  @Column({ name: 'total_income', type: 'decimal', precision: 12, scale: 2 })
  totalIncome: number

  // Computed: 50 / 30 / 20 of totalIncome — stored for query performance
  @Column({ name: 'needs_budget', type: 'decimal', precision: 12, scale: 2, default: 0 })
  needsBudget: number

  @Column({ name: 'wants_budget', type: 'decimal', precision: 12, scale: 2, default: 0 })
  wantsBudget: number

  @Column({ name: 'savings_budget', type: 'decimal', precision: 12, scale: 2, default: 0 })
  savingsBudget: number

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'custom_needs_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  customNeedsPercentage: number

  @Column({ name: 'custom_wants_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  customWantsPercentage: number

  @Column({ name: 'custom_savings_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  customSavingsPercentage: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => User, u => u.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @OneToMany(() => IncomeSource, i => i.budget, { eager: true, cascade: true })
  incomeSources: IncomeSource[]

  @OneToMany(() => ExpenseEntry, e => e.budget)
  expenses: ExpenseEntry[]
}
