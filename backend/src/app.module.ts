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

@Module({
  imports: [
    // Config from .env
    ConfigModule.forRoot({ isGlobal: true }),

    // PostgreSQL via TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type:        'postgres',
        host:        cfg.get('DB_HOST',     'localhost'),
        port:        cfg.get<number>('DB_PORT', 5432),
        username:    cfg.get('DB_USER',     'postgres'),
        password:    cfg.get('DB_PASSWORD', 'postgres'),
        database:    cfg.get('DB_NAME',     'spending_tracker'),
        autoLoadEntities: true,
        synchronize: true, // Auto-create tables in dev
        logging:     cfg.get('NODE_ENV') === 'development',
      }),
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
  ],
})
export class AppModule {}
