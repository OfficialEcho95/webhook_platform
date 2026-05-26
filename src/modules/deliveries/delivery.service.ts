import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './delivery.entity';
import { Destination } from '../destinations/destination.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) { }

  /**
   * Create a delivery for a given event → destination pair
   * Called ONLY by EventFanoutService
   */
  async create(eventId: string, destinationId: number): Promise<Delivery> {
    const delivery = this.deliveryRepo.create({
      eventId,
      destinationId,
      status: DeliveryStatus.PENDING,
      attemptCount: 0,
    });

    return this.deliveryRepo.save(delivery);
  }

  /**
   * Fetch a delivery with its relations
   * Used by workers
   */
  async getById(id: number): Promise<Delivery> {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
      relations: ['event', 'destination'],
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery not found: ${id}`);
    }

    return delivery;
  }


  async markInProgress(deliveryId: number): Promise<void> {
    await this.deliveryRepo.update(
      {
        id: deliveryId,
        status: DeliveryStatus.PENDING,
      },
      {
        status: DeliveryStatus.IN_PROGRESS,
        lastAttemptAt: new Date(),
      },
    );
  }

  /**
   * Mark a delivery as successful
   */
  async markSuccess(params: {
    deliveryId: number;
    responseStatus: number;
    responseBody?: string;
  }): Promise<Delivery> {
    const delivery = await this.getById(params.deliveryId);

    delivery.status = DeliveryStatus.SUCCESS;
    delivery.responseStatus = params.responseStatus;
    delivery.responseBody = params.responseBody;

    return this.deliveryRepo.save(delivery);
  }


  /**
   * Mark a delivery as failed
   */
  async markFailure(params: {
    deliveryId: number;
    errorMessage?: string;
    destination: Destination;
  }): Promise<Delivery> {
    const delivery = await this.getById(params.deliveryId);

    delivery.attemptCount += 1;
    delivery.lastAttemptAt = new Date();
    delivery.errorMessage = params.errorMessage;

    const maxRetries = params.destination.maxRetries;

    if (delivery.attemptCount >= maxRetries) {
      delivery.status = DeliveryStatus.DEAD_LETTER;
      delivery.deadLetterAt = new Date();
      delivery.deadLetterReason =
        params.errorMessage ?? 'Max retries exceeded';
    } else {
      delivery.status = DeliveryStatus.RETRYING;
    }

    return this.deliveryRepo.save(delivery);
  }

  /**
   * Used by retry schedulers / workers
   */
  async findRetryable(limit = 50): Promise<Delivery[]> {
    return this.deliveryRepo.find({
      where: [
        { status: DeliveryStatus.PENDING },
        { status: DeliveryStatus.RETRYING },
      ],
      take: limit,
      order: { updatedAt: 'ASC' },
    });
  }

  /**
   * Mark a delivery as a dead letter used by admin / debug tools
   */
  async markDeadLetter(deliveryId: number, reason: string) {
    const delivery = await this.getById(deliveryId);

    delivery.status = DeliveryStatus.DEAD_LETTER;
    delivery.deadLetterAt = new Date();
    delivery.deadLetterReason = reason;

    return this.deliveryRepo.save(delivery);
  }
}
