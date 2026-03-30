import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNumber, IsDateString }     from 'class-validator'
import { ApiProperty }   from '@nestjs/swagger'
import { JwtAuthGuard }  from '../auth/jwt-auth.guard'
import { BudgetsService } from './budgets.service'

class CreateBudgetDto {
  @ApiProperty({ example: '2026-03-01' }) @IsDateString() month: string
  @ApiProperty({ example: 5000 })         @IsNumber()    initialIncome: number
  @ApiProperty({ example: 'Salary' })     @IsString()    initialSource: string
}

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly svc: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new monthly budget with 50/30/20 allocation' })
  create(@Body() dto: CreateBudgetDto, @Request() req: any) {
    return this.svc.create(req.user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List all user budgets' })
  list(@Request() req: any) { return this.svc.findAll(req.user.id) }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget detail with income sources' })
  get(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.id) }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget and all its expenses' })
  delete(@Param('id') id: string, @Request() req: any) { return this.svc.delete(id, req.user.id) }
}
