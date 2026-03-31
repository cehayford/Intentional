import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthModule }     from './modules/auth/auth.module'
import { UsersModule }    from './modules/users/users.module'
import { BudgetsModule }  from './modules/budgets/budgets.module'
import { IncomeModule }   from './modules/income/income.module'
import { ExpensesModule } from './modules/expenses/expenses.module'
import { AnalyticsModule }from './modules/analytics/analytics.module'
import { HealthModule }   from './health/health.module'

@Module({
  imports: [
    // Config from .env
    ConfigModule.forRoot({ isGlobal: true }),

    // PostgreSQL via TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const databaseUrl = cfg.get<string>('DATABASE_URL')
        const options: Record<string, unknown> = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: true, // Auto-create tables in dev
          logging: cfg.get('NODE_ENV') === 'development',
        }

        if (databaseUrl) {
          options.url = databaseUrl
        } else {
          options.host = cfg.get<string>('DB_HOST', 'localhost')
          options.port = cfg.get<number>('DB_PORT', 5432)
          options.username = cfg.get<string>('DB_USER', 'postgres')
          options.password = cfg.get<string>('DB_PASSWORD', 'postgres')
          options.database = cfg.get<string>('DB_NAME', 'spending_tracker')
        }

        return options
      },
    }),

    // Rate limiting: 100 req/min per user (PRD §9.1)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature modules
    AuthModule,
    UsersModule,
    BudgetsModule,
    IncomeModule,
    ExpensesModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
