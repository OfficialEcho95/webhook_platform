import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as net from 'net';
import { spawn } from 'child_process';

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
    console.log('✅ Redis already running');
    return;
  }

  console.log('🚀 Starting Redis...');
  const redisProcess = spawn('redis-server', [], {
    stdio: 'inherit',
    detached: true,
  });

  redisProcess.unref();
}

async function bootstrap() {
  await startRedisServer();

  const app = await NestFactory.create(AppModule);

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl.startsWith('/payments/webhooks/paystack')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        if (req.originalUrl.startsWith('/payments/webhooks/paystack')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();



// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import * as bodyParser from 'body-parser';
// import * as net from 'net';
// import { spawn } from 'child_process';

// async function isRedisRunning(port = 6379): Promise<boolean> {
//   return new Promise((resolve) => {
//     const socket = net.createConnection(port, '127.0.0.1');

//     socket.once('connect', () => {
//       socket.end();
//       resolve(true);
//     });

//     socket.once('error', () => resolve(false));
//   });
// }

// async function startRedisServer() {
//   const running = await isRedisRunning();

//   if (running) {
//     console.log('✅ Redis already running');
//     return;
//   }

//   console.log('🚀 Starting Redis...');
//   const redisProcess = spawn('redis-server', [], {
//     stdio: 'inherit',
//     detached: true,
//   });

//   redisProcess.unref();
// }

// async function bootstrap() {
//   await startRedisServer();

//   const app = await NestFactory.create(AppModule);

//   /**
//    * IMPORTANT:
//    * Capture rawBody for ALL requests.
//    * We will only USE it for Paystack webhook verification.
//    */
//   app.use(
//     bodyParser.json({
//       verify: (req: any, _res, buf) => {
//         req.rawBody = buf;
//       },
//     }),
//   );

//   app.use(
//     bodyParser.urlencoded({
//       extended: true,
//       verify: (req: any, _res, buf) => {
//         req.rawBody = buf;
//       },
//     }),
//   );

//   const port = process.env.PORT || 3000;
//   await app.listen(port);

//   console.log(`🚀 Server running on http://localhost:${port}`);
// }

// bootstrap();
