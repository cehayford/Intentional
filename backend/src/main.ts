import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist:   true,
    forbidNonWhitelisted: true,
    transform:   true,
    transformOptions: { enableImplicitConversion: true },
  }))

  // CORS for dev
  app.enableCors({ origin: 'http://localhost:3000', credentials: true })

  // API prefix (but exclude health endpoint)
  app.setGlobalPrefix('api/v1', { exclude: ['/health'] })

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Intentional Spending Tracker API')
    .setDescription('50/30/20 budget management REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

  // Get port from environment or use 3001 for Railway
  const port = process.env.PORT || 3001
  
  await app.listen(port)
  console.log(`🚀 API running at http://localhost:${port}/api/v1`)
  console.log(`📚 Docs at http://localhost:${port}/api/docs`)
}
bootstrap()
