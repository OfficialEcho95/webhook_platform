import { Injectable, Logger } from '@nestjs/common';
import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios, { AxiosResponse } from 'axios';
import { DeliveryService } from '../deliveries/delivery.service';
import { Delivery } from '../deliveries/delivery.entity';

@Injectable()
export class DeliveryWorker extends WorkerHost {
  private readonly logger = new Logger(DeliveryWorker.name);

  constructor(private readonly deliveryService: DeliveryService) {
    super();
  }

  /**
   * This is the abstract method from WorkerHost
   * Called automatically when a job is received
   */
  async process(job: Job<{ deliveryId: number }>): Promise<void> {
    const { deliveryId } = job.data;

    let delivery: Delivery;

    try {
      delivery = await this.deliveryService.getById(deliveryId);
      const { destination, event } = delivery;

      if (!destination || !event) {
        this.logger.warn(`Delivery ${deliveryId} missing destination or event`);
        return;
      }

      const payload = event.payload;

      // Optional headers / signing
      const headers = {
        'Content-Type': 'application/json',
        ...(destination.secret ? { 'X-Signature': destination.secret } : {}),
      };

      this.logger.log(`Sending delivery ${deliveryId} → ${destination.url}`);

      let response: AxiosResponse;

      try {
        response = await axios.post(destination.url, payload, { headers, timeout: 10000 });
      } catch (err: any) {
        await this.deliveryService.recordAttempt({
          deliveryId,
          success: false,
          errorMessage: err.message,
          destination,
        });
        this.logger.error(`Delivery ${deliveryId} failed: ${err.message}`);
        return;
      }

      await this.deliveryService.recordAttempt({
        deliveryId,
        success: response.status >= 200 && response.status < 300,
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data),
        destination,
      });

      this.logger.log(`Delivery ${deliveryId} processed successfully`);
    } catch (err: any) {
      this.logger.error(`Error processing delivery ${deliveryId}: ${err.message}`);
    }
  }

  // Optional lifecycle hooks
  async onJobActive(job: Job): Promise<void> {
    this.logger.debug(`Job ${job.id} is now active`);
  }

  async onJobCompleted(job: Job, result: any): Promise<void> {
    this.logger.debug(`Job ${job.id} completed`);
  }

  async onJobFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
