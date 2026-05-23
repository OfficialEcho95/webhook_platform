import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { DeliveryService } from '../deliveries/delivery.service';
import { DeliveryStatus } from '../deliveries/delivery.entity';

@Injectable()
@Processor('webhook-delivery')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly deliveryService: DeliveryService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { deliveryId } = job.data;

    /**
     * Load full delivery aggregate
     */
    const delivery = await this.deliveryService.getById(deliveryId);
    const event = delivery.event;
    const destination = delivery.destination;

    /**
     * Prevent duplicate execution
     */
    if (delivery.status === DeliveryStatus.SUCCESS) {
      this.logger.warn(
        `Delivery already succeeded: ${delivery.id}`,
      );

      return;
    }

    const timestamp = event.createdAt.getTime();

    /**
     * Canonical webhook payload
     */
    const payload = {
      id: event.id,
      type: event.eventType,
      createdAt: event.createdAt,
      data: event.payload,
    };

    const body = JSON.stringify(payload);

    /**
     * Stripe-style signing
     */
    const signedPayload = `${timestamp}.${body}`;

    const signature = createHmac('sha256', destination.secret || '')
      .update(signedPayload)
      .digest('hex');

    /**
     * Timeout protection
     */
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch(destination.url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          /**
           * Webhook metadata
           */
          'X-Webhook-Id': event.id,
          'X-Webhook-Event': event.eventType,
          /**
           * Signature format:
           * t=timestamp,v1=signature
           */
          'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,

          /**
           * Custom destination headers
           */
          ...(destination.headers || {}),
        },
        body,
      });

      const responseBody = await response.text();

      if (!response.ok) {
        await this.deliveryService.recordAttempt({
          deliveryId: delivery.id,
          success: false,
          responseStatus: response.status,
          responseBody,
          errorMessage: `HTTP ${response.status}`,
          destination,
        });

        throw new Error(
          `Webhook failed with status ${response.status}`,
        );
      }

      /**
       * Mark success
       */
      await this.deliveryService.recordAttempt({
        deliveryId: delivery.id,
        success: true,
        responseStatus: response.status,
        responseBody,
        destination,
      });

      this.logger.log(
        `Webhook delivered successfully | Delivery: ${delivery.id}`,
      );

      return { success: true };
    } catch (error: any) {
      /**
       * Abort / network / DNS / timeout errors
       */
      await this.deliveryService.recordAttempt({
        deliveryId: delivery.id,
        success: false,
        errorMessage:
          error?.message || 'Unknown webhook error',
        destination,
      });

      this.logger.error(
        `Webhook delivery failed | Delivery: ${delivery.id} | Error: ${error.message}`,
      );

      /**
       * Throw so BullMQ retries
       */
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}