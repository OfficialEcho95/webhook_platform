import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { WebhookEntity } from './webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { EventEntity } from '../events/event.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DestinationService } from '../destinations/destination.service';
import { DeliveryService } from '../deliveries/delivery.service';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookEntity)
    private readonly webhookRepo: Repository<WebhookEntity>,
    private readonly destinationService: DestinationService,
    private readonly deliveryService: DeliveryService,
    @InjectQueue('webhook-delivery') private readonly webhookQueue: Queue) {}

  /**
   * MAIN FANOUT ENTRY POINT
   * Event → Destinations → Deliveries → Queue
   */
  async dispatchEvent(event: EventEntity): Promise<void> {
    const destinations =
      await this.destinationService.findActiveForEvent(
        event.tenantId,
        event.eventType,
      );

    if (!destinations.length) return;

    await Promise.all(
      destinations.map(async (destination) => {
        const delivery = await this.deliveryService.create(
          event.id,
          destination.id,
        );

        await this.webhookQueue.add(
          'send-webhook',
          {
            deliveryId: delivery.id,
          },
          {
            attempts: destination.maxRetries,
            backoff: {
              type: 'fixed',
              delay:
                destination.retryDelaySeconds * 1000,
            },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );
      }),
    );
  }

  async createWebhook(dto: CreateWebhookDto) {
    const secret = `whsec_${randomBytes(24).toString('hex')}`;

    const webhook = this.webhookRepo.create({
      ...dto,
      secret,
    });

    return this.webhookRepo.save(webhook);
  }
}