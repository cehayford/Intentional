import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm'
import { User } from '../users/user.entity'

@Entity('budget_rules')
export class BudgetRule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ name: 'needs_percentage', type: 'decimal', precision: 5, scale: 2 })
  needsPercentage: number

  @Column({ name: 'wants_percentage', type: 'decimal', precision: 5, scale: 2 })
  wantsPercentage: number

  @Column({ name: 'savings_percentage', type: 'decimal', precision: 5, scale: 2 })
  savingsPercentage: number

  @Column({ name: 'is_default', default: false })
  isDefault: boolean

  @Column({ name: 'is_custom', default: false })
  isCustom: boolean

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string // 'predefined' | 'custom' | 'template'

  @ManyToOne(() => User, u => u.budgetRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Validation method to ensure percentages sum to 100
  validatePercentages(): boolean {
    const total = this.needsPercentage + this.wantsPercentage + this.savingsPercentage
    return Math.abs(total - 100) < 0.01 // Allow for floating point precision
  }
}
