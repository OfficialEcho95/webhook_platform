import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from '../destinations/destination.entity';

@Injectable()
export class DestinationService {
  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepo: Repository<Destination>,
  ) {}

  async create(data: Partial<Destination>): Promise<Destination> {
    const destination = this.destinationRepo.create(data);
    return this.destinationRepo.save(destination);
  }

  async findActiveForEvent(
    tenantId: number,
    eventType: string,
  ): Promise<Destination[]> {
    return this.destinationRepo.find({
      where: {
        tenantId,
        eventType,
        isActive: true,
      },
    });
  }

  async disable(id: number): Promise<void> {
    await this.destinationRepo.update(id, { isActive: false });
  }
}
