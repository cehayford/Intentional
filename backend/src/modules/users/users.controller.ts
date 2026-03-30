import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength }      from 'class-validator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string
  @IsOptional() @IsString() @MaxLength(100) lastName?: string
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return this.svc.getProfile(req.user.id)
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile (first/last name)' })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.svc.updateProfile(req.user.id, dto)
  }
}
