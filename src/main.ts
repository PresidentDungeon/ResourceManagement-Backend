import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options: CorsOptions = {origin: ['http://localhost:4200']}
  app.enableCors(options)
  const configService: ConfigService = app.get(ConfigService);
  await app.listen(configService.get('PORT'));
}
bootstrap();
