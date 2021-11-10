import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  const options: CorsOptions = {origin: [configService.get('FRONTEND_ROUTE')]}
  app.enableCors(options)
  await app.listen(configService.get('PORT'));
}
bootstrap();
