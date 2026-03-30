import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }       from 'typeorm'
import { User }             from './user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    // Exclude passwordHash
    const { passwordHash, ...safeUser } = user
    return safeUser
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string }) {
    const user = await this.users.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    
    if (dto.firstName) user.firstName = dto.firstName
    if (dto.lastName)  user.lastName  = dto.lastName
    
    await this.users.save(user)
    const { passwordHash, ...safeUser } = user
    return safeUser
  }
}
