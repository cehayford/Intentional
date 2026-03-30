import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation }   from '@nestjs/swagger'
import { AuthService }             from './auth.service'
import { RegisterDto }             from './dto/register.dto'
import { LoginDto }                from './dto/login.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/v1/auth/register */
  @Post('register')
  @ApiOperation({ summary: 'Register new user account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  /** POST /api/v1/auth/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token pair' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  /** POST /api/v1/auth/refresh */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token (rotation)' })
  refresh(@Body('refreshToken') rt: string) {
    return this.auth.refresh(rt)
  }

  /** POST /api/v1/auth/logout */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token' })
  logout(@Body('refreshToken') rt: string) {
    return this.auth.logout(rt)
  }
}
