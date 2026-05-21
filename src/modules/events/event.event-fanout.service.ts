import { Injectable, Logger } from '@nestjs/common';
import { DeliveryService } from '../deliveries/delivery.service';
import { DestinationService } from '../destinations/destination.service';
import { Queue } from 'bullmq';
import { RedisServer } from '../../../redisServer';
import { EventEntity } from './event.entity';

@Injectable()
export class EventFanoutService {
  private readonly logger = new Logger(EventFanoutService.name);
  private deliveryQueue: Queue;

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly destinationService: DestinationService,
    private readonly redisServer: RedisServer,
  ) {
    this.deliveryQueue = new Queue('webhook-delivery', {
      connection: this.redisServer.getConnection(),
    });
  }

  /**
   * Fan out an event to all destinations
   */
  async fanout(event: EventEntity): Promise<void> {
    // 1️⃣ Get all destinations for this tenant and event type
    const destinations = await this.destinationService.findActiveForEvent(
      event.tenantId,
      event.eventType,
    );

    if (!destinations.length) {
      this.logger.log(`No destinations configured for event ${event.id}`);
      return;
    }

    // 2️⃣ Create delivery records and enqueue jobs
    for (const destination of destinations) {
      const delivery = await this.deliveryService.create(event.id, destination.id);

      await this.deliveryQueue.add('deliver-webhook', {
        deliveryId: delivery.id,
      });

      this.logger.log(
        `Delivery ${delivery.id} created for event ${event.id} → ${destination.url}`,
      );
    }
  }
}
