import { IsString, IsNumber, IsOptional, IsDecimal, Max, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBudgetRuleDto {
  @ApiProperty({ 
    description: 'Name of the budget rule',
    example: 'My Custom Rule'
  })
  @IsString()
  name: string

  @ApiProperty({ 
    description: 'Percentage for needs category',
    example: 50.00,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  needsPercentage: number

  @ApiProperty({ 
    description: 'Percentage for wants category',
    example: 30.00,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  wantsPercentage: number

  @ApiProperty({ 
    description: 'Percentage for savings category',
    example: 20.00,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @IsDecimal()
  @Min(0)
  @Max(100)
  savingsPercentage: number

  @ApiPropertyOptional({ 
    description: 'Description of the budget rule',
    example: 'Custom rule for my specific financial situation'
  })
  @IsOptional()
  @IsString()
  description?: string
}
