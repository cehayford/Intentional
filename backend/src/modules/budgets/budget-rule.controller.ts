import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param,
  UseGuards,
  Request
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BudgetRuleService } from './budget-rule.service'
import { CreateBudgetRuleDto } from './dto/create-budget-rule.dto'

// Simple update DTO inline to avoid import issues
class UpdateBudgetRuleDto {
  name?: string
  needsPercentage?: number
  wantsPercentage?: number
  savingsPercentage?: number
  description?: string
}

@ApiTags('Budget Rules')
@Controller('budget-rules')
@UseGuards(JwtAuthGuard)
export class BudgetRuleController {
  constructor(private readonly budgetRuleService: BudgetRuleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available budget rules' })
  @ApiResponse({ status: 200, description: 'Budget rules retrieved successfully' })
  async findAll(@Request() req) {
    return this.budgetRuleService.findAll(req.user.id)
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default budget rule' })
  @ApiResponse({ status: 200, description: 'Default budget rule retrieved successfully' })
  async getDefault() {
    return this.budgetRuleService.getDefaultRule()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget rule' })
  @ApiResponse({ status: 200, description: 'Budget rule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Budget rule not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.budgetRuleService.findOne(id, req.user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom budget rule' })
  @ApiResponse({ status: 201, description: 'Custom budget rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createCustomRule(@Body() createBudgetRuleDto: CreateBudgetRuleDto, @Request() req) {
    return this.budgetRuleService.createCustomRule(req.user.id, createBudgetRuleDto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a custom budget rule' })
  @ApiResponse({ status: 200, description: 'Budget rule updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify predefined rules' })
  @ApiResponse({ status: 404, description: 'Budget rule not found' })
  async updateCustomRule(
    @Param('id') id: string, 
    @Body() updateBudgetRuleDto: UpdateBudgetRuleDto, 
    @Request() req
  ) {
    return this.budgetRuleService.updateCustomRule(id, req.user.id, updateBudgetRuleDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom budget rule' })
  @ApiResponse({ status: 200, description: 'Budget rule deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete predefined rules or rules in use' })
  @ApiResponse({ status: 404, description: 'Budget rule not found' })
  async deleteCustomRule(@Param('id') id: string, @Request() req) {
    await this.budgetRuleService.deleteCustomRule(id, req.user.id)
    return { message: 'Budget rule deleted successfully' }
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize predefined budget rules (system endpoint)' })
  @ApiResponse({ status: 200, description: 'Predefined rules initialized successfully' })
  async initializePredefinedRules() {
    await this.budgetRuleService.createPredefinedRules()
    return { message: 'Predefined budget rules initialized successfully' }
  }
}
