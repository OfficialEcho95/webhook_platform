import { Module } from '@nestjs/common';
import { QueueTenant } from './tenant.queue';
import { RedisServer } from '../../../../../redisServer'; 

@Module({
  imports: [],
  providers: [QueueTenant, RedisServer],
  exports: [QueueTenant], // Export it so other services can use it
})
export class TenantQueueModule {}