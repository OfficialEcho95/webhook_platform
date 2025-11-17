import { Module } from '@nestjs/common';
import { RedisServer } from './redisServer';

@Module({
  providers: [RedisServer],
  exports: [RedisServer],
})
export class RedisModule {}
