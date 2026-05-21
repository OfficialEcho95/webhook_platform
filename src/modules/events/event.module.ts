import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './event.entity';
import { EventRepository } from './event.repository';
import { EventService } from './event.service';
import { EventFanoutService } from './event.event-fanout.service';
import { DestinationModule } from '../destinations/destination.module';
import { DeliveryService } from '../deliveries/delivery.service';
import { RedisServer } from 'redisServer';
import { DeliveryModule } from '../deliveries/delivery.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity]), DestinationModule, DeliveryModule],
  providers: [EventService, EventRepository,
    EventFanoutService, RedisServer],
  exports: [EventService], // So other modules can use it
})
export class EventModule { }
