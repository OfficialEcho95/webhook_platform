import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from '../destinations/destination.entity';
import { DestinationService } from '../destinations/destination.service';
import { DestinationController } from '../destinations/destination.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Destination])],
  providers: [DestinationService],
  controllers: [DestinationController],
  exports: [DestinationService],
})
export class DestinationModule {}
