import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Budget }       from '../budgets/budget.entity'
import { RefreshToken } from './refresh-token.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string

  @Column({ unique: true })
  @ApiProperty()
  email: string

  @Column({ name: 'password_hash' })
  passwordHash: string

  @Column({ name: 'first_name', nullable: true })
  @ApiProperty({ required: false })
  firstName?: string

  @Column({ name: 'last_name', nullable: true })
  @ApiProperty({ required: false })
  lastName?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => Budget, b => b.user)
  budgets: Budget[]

  @OneToMany(() => RefreshToken, rt => rt.user)
  refreshTokens: RefreshToken[]
}
