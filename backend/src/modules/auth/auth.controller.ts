import { Controller, Post, Body, HttpCode, HttpStatus, Get, Delete, Put, Patch, MethodNotAllowedException } from '@nestjs/common'
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

  /** Disable GET requests to register endpoint */
  @Get('register')
  @ApiOperation({ summary: 'GET method not allowed for registration' })
  getRegister() {
    throw new MethodNotAllowedException('POST method required for registration')
  }

  /** Disable PUT requests to register endpoint */
  @Put('register')
  @ApiOperation({ summary: 'PUT method not allowed for registration' })
  putRegister() {
    throw new MethodNotAllowedException('POST method required for registration')
  }

  /** Disable DELETE requests to register endpoint */
  @Delete('register')
  @ApiOperation({ summary: 'DELETE method not allowed for registration' })
  deleteRegister() {
    throw new MethodNotAllowedException('POST method required for registration')
  }

  /** Disable PATCH requests to register endpoint */
  @Patch('register')
  @ApiOperation({ summary: 'PATCH method not allowed for registration' })
  patchRegister() {
    throw new MethodNotAllowedException('POST method required for registration')
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
