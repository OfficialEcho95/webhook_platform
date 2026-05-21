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
  ) {}

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

  /**
   * Mark an attempt result
   */
  async recordAttempt(params: {
    deliveryId: number;
    success: boolean;
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
    destination: Destination;
  }): Promise<Delivery> {
    const delivery = await this.getById(params.deliveryId);

    delivery.attemptCount += 1;
    delivery.lastAttemptAt = new Date();
    delivery.responseStatus = params.responseStatus;
    delivery.responseBody = params.responseBody;
    delivery.errorMessage = params.errorMessage;

    if (params.success) {
      delivery.status = DeliveryStatus.SUCCESS;
      return this.deliveryRepo.save(delivery);
    }

    const maxRetries = params.destination.maxRetries;

    if (delivery.attemptCount <= maxRetries) {
      delivery.status = DeliveryStatus.RETRYING;
    } else {
      delivery.status = DeliveryStatus.FAILED;
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
   * Manual override / admin use
   */
  async markFailed(
    deliveryId: number,
    reason: string,
  ): Promise<Delivery> {
    const delivery = await this.getById(deliveryId);

    delivery.status = DeliveryStatus.FAILED;
    delivery.errorMessage = reason;

    return this.deliveryRepo.save(delivery);
  }
}
