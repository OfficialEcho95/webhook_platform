import { Repository } from "typeorm";
import { EventFailure } from "./eventFailure.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class EventFailureService {
  constructor(
    @InjectRepository(EventFailure)
    private readonly failureRepo: Repository<EventFailure>,
  ) {}

  async recordFailure(input: {
    eventId: string;
    tenantId: number;
    eventType: string;
    payload: Record<string, any>;
    reason: string;
  }) {
    return this.failureRepo.save(
      this.failureRepo.create({
        ...input,
        replayed: false,
      }),
    );
  }

  async markReplayed(id: number) {
    await this.failureRepo.update(id, {
      replayed: true,
      replayedAt: new Date(),
    });
  }
}