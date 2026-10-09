import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { frontendUrl } from './auth/social/social.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway rulează în spatele unui proxy: necesar ca req.ip să fie IP-ul real
  app.set('trust proxy', 1);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = new Set<string>([
    frontendUrl(),
    ...(process.env.CORS_EXTRA_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ]);
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://localhost:5173');
  }

  app.enableCors({
    origin: (origin, callback) => {
      // fără Origin = apeluri server-to-server / redirect-uri OAuth: le lăsăm
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(null, false);
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();