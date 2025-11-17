import { Redis } from 'ioredis';

export class RedisServer {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null, // REQUIRED for BullMQ
      enableReadyCheck: false,
      db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
 
    this.redis.on('connect', () => {
      console.log('🔌 Connected to Redis');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  getConnection(): Redis {
    return this.redis;
  } 
}
