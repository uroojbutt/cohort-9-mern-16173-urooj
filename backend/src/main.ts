import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import * as dns from 'dns';

if (process.env.USE_CUSTOM_DNS === 'true') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useGlobalPipes(new ValidationPipe());
    app.useLogger(app.get(Logger));
    await app.listen(process.env.PORT ?? 3000);
  } catch (error) {
    console.error('Application failed to start:', error);
    process.exit(1);
  }
}
bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
