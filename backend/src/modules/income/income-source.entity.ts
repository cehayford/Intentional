import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Budget } from '../budgets/budget.entity'

@Entity('income_sources')
export class IncomeSource {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'source_name', length: 200 })
  sourceName: string

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => Budget, b => b.incomeSources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget
}
