import { Injectable, Logger } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { DeliveryService } from '../deliveries/delivery.service';
import { Delivery } from '../deliveries/delivery.entity';
import { EventFailureService } from '../events/replayEvent.service';

@Injectable()
export class DeliveryWorker extends WorkerHost {
  private readonly logger = new Logger(DeliveryWorker.name);

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly failureService: EventFailureService,
  ) {
    super();
  }

  async process(job: Job<{ deliveryId: number }>): Promise<void> {
    const { deliveryId } = job.data;

    const delivery = await this.deliveryService.getById(deliveryId);

    const { destination, event } = delivery;

    if (!destination || !event) {
      this.logger.warn(
        `Delivery ${deliveryId} missing event or destination`,
      );
      return;
    }

    try {
      /**
       * 1. mark in progress
       */
      await this.deliveryService.markInProgress(deliveryId);

      this.logger.log(
        `Dispatching delivery ${deliveryId} → ${destination.url}`,
      );

      /**
       * 2. execute webhook
       */
      const response = await axios.post(
        destination.url,
        {
          event: event.eventType,
          payload: event.payload,
          timestamp: event.createdAt,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            ...(destination.secret
              ? { 'X-Signature': destination.secret }
              : {}),
          },
        },
      );

      /**
       * 3. mark success
       */
      await this.deliveryService.markSuccess({
        deliveryId,
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data),
      });

      this.logger.log(`Delivery ${deliveryId} succeeded`);
    } catch (err: any) {
      /**
       * 4. mark delivery failure ONLY
       * (retry logic stays inside DeliveryService + BullMQ)
       */
      await this.deliveryService.markFailure({
        deliveryId,
        errorMessage: err.message,
        destination,
      });

      /**
        *record EVENT-level failure ONLY if final failure
        * (i.e. if we've exhausted all retries for this destination, then we consider 
        * the EVENT delivery as failed and record it in the event_failures table)
       */
      if (delivery.attemptCount >= destination.maxRetries) {
        await this.failureService.recordFailure({
          eventId: event.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          payload: event.payload,
          reason: err.message,
        });
      }

      this.logger.error(
        `Delivery ${deliveryId} failed: ${err.message}`,
      );

      throw err;
    }
  }
}