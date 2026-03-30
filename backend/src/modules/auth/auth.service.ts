import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common'
import { JwtService }     from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository }     from 'typeorm'
import * as bcrypt        from 'bcryptjs'
import { User }           from '../users/user.entity'
import { RefreshToken }   from '../users/refresh-token.entity'
import { RegisterDto }    from './dto/register.dto'
import { LoginDto }       from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)         private users:   Repository<User>,
    @InjectRepository(RefreshToken) private tokens:  Repository<RefreshToken>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } })
    if (exists) throw new ConflictException('Email already registered')

    // PRD §6.1: bcrypt 12 rounds
    const passwordHash = await bcrypt.hash(dto.password, 12)
    const user = this.users.create({ email: dto.email, firstName: dto.firstName, lastName: dto.lastName, passwordHash })
    await this.users.save(user)
    return this.issueTokens(user)
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')
    return this.issueTokens(user)
  }

  async refresh(refreshToken: string) {
    const stored = await this.tokens.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    })
    if (!stored || stored.expiresAt < new Date())
      throw new UnauthorizedException('Invalid or expired refresh token')

    // Rotation: revoke old, issue new pair
    stored.isRevoked = true
    await this.tokens.save(stored)
    return this.issueTokens(stored.user)
  }

  async logout(refreshToken: string) {
    await this.tokens.update({ token: refreshToken }, { isRevoked: true })
    return { message: 'Logged out successfully' }
  }

  // ── Private: issue access + refresh token pair ───────────────
  private async issueTokens(user: User) {
    // Access token: 15 min (PRD §11 Security)
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    )

    // Refresh token: 7 days
    const rawRefresh  = this.jwt.sign({ sub: user.id }, { expiresIn: '7d' })
    const expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const rt = this.tokens.create({ token: rawRefresh, expiresAt, user })
    await this.tokens.save(rt)

    return {
      accessToken,
      refreshToken: rawRefresh,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    }
  }
}
