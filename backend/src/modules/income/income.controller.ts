import { Controller, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { IsString, IsNumber, IsOptional, Min }  from 'class-validator'
import { ApiProperty }    from '@nestjs/swagger'
import { Transform }      from 'class-transformer'
import { JwtAuthGuard }   from '../auth/jwt-auth.guard'
import { IncomeService }  from './income.service'

class AddIncomeDto {
  @ApiProperty() @IsString()  budgetId:   string
  @ApiProperty() @IsString()  sourceName: string
  @ApiProperty() @IsNumber() @Min(0.01) @Transform(({ value }) => Number(value)) amount: number
}
class UpdateIncomeDto {
  @IsOptional() @IsString()  sourceName?: string
  @IsOptional() @IsNumber() @Min(0.01) @Transform(({ value }) => Number(value)) amount?: number
}

@ApiTags('Income')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income')
export class IncomeController {
  constructor(private readonly svc: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Add income source (triggers budget recalculation)' })
  add(@Body() dto: AddIncomeDto) { return this.svc.add(dto) }

  @Patch(':id')
  @ApiOperation({ summary: 'Update income source (triggers recalculation)' })
  update(@Param('id') id: string, @Body() dto: UpdateIncomeDto) { return this.svc.update(id, dto) }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove income source (triggers recalculation)' })
  delete(@Param('id') id: string) { return this.svc.delete(id) }
}
