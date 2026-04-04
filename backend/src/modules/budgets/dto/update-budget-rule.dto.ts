import { IsString, IsNumber, IsOptional, IsDecimal, Max, Min } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateBudgetRuleDto {
  @ApiPropertyOptional({ 
    description: 'Name of the budget rule',
    example: 'Updated Custom Rule'
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ 
    description: 'Percentage for needs category',
    example: 55.00,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  needsPercentage?: number

  @ApiPropertyOptional({ 
    description: 'Percentage for wants category',
    example: 25.00,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  wantsPercentage?: number

  @ApiPropertyOptional({ 
    description: 'Percentage for savings category',
    example: 20.00,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  savingsPercentage?: number

  @ApiPropertyOptional({ 
    description: 'Description of the budget rule',
    example: 'Updated description for my specific financial situation'
  })
  @IsOptional()
  @IsString()
  description?: string
}
