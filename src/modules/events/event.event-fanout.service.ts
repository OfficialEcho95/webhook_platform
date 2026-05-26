// event-fanout.service.ts

import { Injectable } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import { EventEntity } from './event.entity';

import { DestinationService } from '../destinations/destination.service';

import { DeliveryService } from '../deliveries/delivery.service';

@Injectable()
export class EventFanoutService {
  constructor(
    private readonly destinationService: DestinationService,
    private readonly deliveryService: DeliveryService,
    @InjectQueue('webhook-delivery') private readonly webhookQueue: Queue,
  ) { }

  async fanout(event: EventEntity): Promise<void> {
    /**
     * Find subscribed destinations
     */
    const destinations =
      await this.destinationService.findActiveForEvent(
        event.tenantId,
        event.eventType,
      );

    if (!destinations.length) {
      return;
    }

    /**
     * One delivery per destination
     */
    await Promise.all(
      destinations.map(async (destination) => {
        const delivery =
          await this.deliveryService.create(
            event.id,
            destination.id,
          );

        await this.webhookQueue.add(
          'send-webhook',
          {
            deliveryId: delivery.id,
          },
          {
            jobId: `delivery:${delivery.id}`,

            attempts: destination.maxRetries,

            backoff: {
              type: 'fixed',
              delay:
                destination.retryDelaySeconds *
                1000,
            },

            removeOnComplete: 1000,

            removeOnFail: 5000,
          },
        );
      }),
    );
  }
}