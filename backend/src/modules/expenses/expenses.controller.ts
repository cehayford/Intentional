import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, IsUUID, Min } from 'class-validator'
import { ApiProperty }    from '@nestjs/swagger'
import { Transform }      from 'class-transformer'
import { JwtAuthGuard }   from '../auth/jwt-auth.guard'
import { ExpensesService } from './expenses.service'
import { ExpenseCategory } from './expense-category.enum'

class CreateExpenseDto {
  @ApiProperty() @IsUUID()       budgetId:    string
  @ApiProperty({ enum: ExpenseCategory }) @IsEnum(ExpenseCategory) category: ExpenseCategory
  @ApiProperty() @IsNumber() @Min(0.01) @Transform(({ value }) => Number(value)) amount: number
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string
  @ApiProperty() @IsDateString() expenseDate: string
}

class UpdateExpenseDto {
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory
  @IsOptional() @IsNumber() @Min(0.01)  @Transform(({ value }) => Number(value)) amount?: number
  @IsOptional() @IsString()             description?: string
  @IsOptional() @IsDateString()         expenseDate?: string
}

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly svc: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new expense' })
  create(@Body() dto: CreateExpenseDto, @Request() req: any) {
    return this.svc.create(req.user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List expenses, filterable by budgetId, category, search' })
  @ApiQuery({ name:'budgetId', required:false })
  @ApiQuery({ name:'category', required:false, enum: ExpenseCategory })
  @ApiQuery({ name:'search',   required:false })
  list(
    @Query('budgetId') budgetId?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('search')   search?:   string,
  ) {
    return this.svc.findAll({ budgetId, category, search })
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  delete(@Param('id') id: string) {
    return this.svc.delete(id)
  }
}
