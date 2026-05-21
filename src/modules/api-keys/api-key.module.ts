import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from './api-key.entity';
import { RedisServer } from 'redisServer';

@Module({
  imports: [
    // Register the ApiKey entity for use in ApiKeyService
    TypeOrmModule.forFeature([ApiKey])
  ],
  providers: [ApiKeyService,  RedisServer,],
  exports: [ApiKeyService], // Export so AuthGuards or other modules can use validateAndCheckLimit
})
export class ApiKeyModule {}