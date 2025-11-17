import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { RedisServer } from 'redisServer';
import { spawn } from 'child_process';
import * as net from 'net';

async function isRedisRunning(port = 6379): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function startRedisServer() {
  const running = await isRedisRunning();
  if (running) {
    console.log('✅ Redis is already running on port 6379');
    return;
  }

  console.log('🚀 Starting local Redis server...');
  try {
    // spawn Redis in background (assumes redis-server is installed)
    const redisProcess = spawn('redis-server', [], {
      stdio: 'inherit',
      detached: true,
    });
    redisProcess.unref();

    console.log('✅ Redis server started successfully');
  } catch (err) {
    console.error('❌ Failed to start Redis automatically:', err);
  }
}


async function bootstrap() {
  await startRedisServer();
  new RedisServer().getConnection()

  const app = await NestFactory.create(AppModule);

  // ✅ Capture raw body for signature verification
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        if (req.originalUrl.startsWith('/webhooks/paystack')) {
          req.rawBody = buf.toString(); // convert Buffer → string
        }
      },
    }),
  );

  // capture raw for urlencoded too
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: any, res, buf) => {
        if (req.originalUrl.startsWith('/webhooks/paystack')) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
