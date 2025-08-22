import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // allows cross-origin requests (useful for frontend)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true })); // enables validation and sanitization of incoming requests (email format, password length)

  await app.listen(3001);
  console.log('Server running on http://localhost:3001');
}
bootstrap();
