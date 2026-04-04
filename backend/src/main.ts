import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Keep root path healthy for basic platform probes and manual checks.
  const httpAdapter = app.getHttpAdapter()
  const instance = httpAdapter.getInstance()
  instance.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'intentional-backend',
      health: '/health',
      apiBase: '/api/v1',
      docs: '/api/docs',
    })
  })

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist:   true,
    forbidNonWhitelisted: true,
    transform:   true,
    transformOptions: { enableImplicitConversion: true },
  }))

  const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  // Add localhost for development
  frontendOrigins.push('http://localhost:3000', 'http://localhost:3001')

  console.log('🔓 CORS origins:', frontendOrigins)

  // Enhanced CORS configuration
  app.enableCors({ 
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true)
      
      // Check if origin is in allowed list
      if (frontendOrigins.includes(origin)) {
        return callback(null, true)
      } else {
        console.log('❌ CORS blocked origin:', origin)
        return callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })

  // API prefix (but exclude health endpoint)
  app.setGlobalPrefix('api/v1', { exclude: ['health'] })

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Intentional Spending Tracker API')
    .setDescription('50/30/20 budget management REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api/v1', 'Production API')
    .addServer('http://localhost:3001/api/v1', 'Development API')
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  // Get port from environment or use 3001 for Railway
  const port = Number(process.env.PORT || 3001)

  await app.listen(port, '0.0.0.0')
  console.log(`🚀 API running at http://localhost:${port}/api/v1`)
  console.log(`📚 Docs at http://localhost:${port}/api/docs`)
}
bootstrap()
