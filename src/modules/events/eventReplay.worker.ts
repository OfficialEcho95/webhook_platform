import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { EventEntity } from "./event.entity";
import { EventFailure } from "./eventFailure.entity";
import { EventFanoutService } from "./event.event-fanout.service";
import { Job } from "bullmq";


@Injectable()
@Processor('event-replay')
export class EventReplayWorker extends WorkerHost {
  constructor(
    private readonly eventRepo: Repository<EventEntity>,
    private readonly eventFailureRepo: Repository<EventFailure>,
    private readonly eventFanoutService: EventFanoutService,
  ) {
    super();
  }

  async process(job: Job<{ failureId: number }>) {
    const failure = await this.eventFailureRepo.findOne({
      where: { id: job.data.failureId },
    });

    if (!failure || failure.replayed) return;

    const event = await this.eventRepo.findOne({
      where: { id: failure.eventId },
    });

    if (!event) return;

    await this.eventFanoutService.fanout(event);

    await this.eventFailureRepo.update(failure.id, {
      replayed: true,
      replayedAt: new Date(),
    });
  }
}