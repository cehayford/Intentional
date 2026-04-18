import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
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
    // Load local .env files in non-production only.
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    // PostgreSQL via TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const getFirst = (...keys: string[]): string | undefined => {
          for (const key of keys) {
            const value = cfg.get<string>(key)
            if (value && value.trim().length > 0) {
              return value
            }
          }
          return undefined
        }

        const nodeEnv = cfg.get<string>('NODE_ENV', 'development')
        const isProduction = nodeEnv === 'production'
        const databaseUrl = getFirst(
          'DATABASE_URL',
          'DATABASE_PRIVATE_URL',
          'POSTGRES_URL',
          'POSTGRESQL_URL',
          'PG_CONNECTION_STRING',
        )
        const sslEnabled = isProduction && cfg.get<string>('DB_SSL', 'true') !== 'false'

        const baseOptions: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: true, // Auto-create tables in dev
          logging: nodeEnv === 'development',
          ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
        }

        if (databaseUrl) {
          return {
            ...baseOptions,
            url: databaseUrl,
          }
        }

        return {
          ...baseOptions,
          host: getFirst('DB_HOST', 'DATABASE_HOST', 'POSTGRES_HOST', 'PGHOST') ?? 'localhost',
          port: Number(
            getFirst('DB_PORT', 'DATABASE_PORT', 'POSTGRES_PORT', 'PGPORT') ?? 5432,
          ),
          username: getFirst('DB_USER', 'DATABASE_USER', 'POSTGRES_USER', 'PGUSER') ?? 'postgres',
          password: getFirst('DB_PASSWORD', 'DATABASE_PASSWORD', 'POSTGRES_PASSWORD', 'PGPASSWORD') ?? 'postgres',
          database: getFirst('DB_NAME', 'DATABASE_NAME', 'POSTGRES_DB', 'PGDATABASE') ?? 'spending_tracker',
        }
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
