import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import * as cookieParser from 'cookie-parser'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')

  app.enableCors({
    origin: ['https://instrugo.frle.net', 'http://localhost:3000'],
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe())

  app.use(cookieParser())

  await app.listen(8000)
}
bootstrap()
