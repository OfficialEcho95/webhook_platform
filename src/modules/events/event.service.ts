import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from './event.repository';
import { EventEntity } from './event.entity';
import { v4 as uuidv4 } from 'uuid';
import { EventFanoutService } from './event.event-fanout.service';
import { EVENT_REGISTRY } from "../events/event.registry";
import { EventFailure } from './eventFailure.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class EventService {
    private readonly logger = new Logger(EventService.name);

    constructor(
        private readonly eventRepo: EventRepository,
        private readonly eventFanoutService: EventFanoutService,
        @InjectRepository(EventFailure)
        private readonly eventFailureRepo: Repository<EventFailure>,
        @InjectQueue('event-replay') private readonly replayQueue: Queue,
    ) { }

    async logEvent(
        tenantId: number,
        eventType: string,
        payload: Record<string, any>,
        actorId?: number,
        options?: {
            correlationId?: string;
            idempotencyKey?: string;
            metadata?: Record<string, any>
        }
    ): Promise<EventEntity> {
        // ensure event type exists in registry
        const eventDef = EVENT_REGISTRY[eventType];
        if (!eventDef) {
            throw new Error(`Unrecognized event type: ${eventType}`);
        }

        //validate payload against event definition
        const isValid = eventDef.validate(payload);
        if (!isValid) {
            throw new Error(`Invalid payload for event type: ${eventType}`);
        }

        // idempotency protection
        if (options?.idempotencyKey) {
            const existing = await this.eventRepo.findOne({
                where: {
                    idempotencyKey: options.idempotencyKey,
                },
            });

            if (existing) {
                return existing;
            }
        }

        const event = this.eventRepo.create({
            id: uuidv4(),
            tenantId,
            actorId: actorId || undefined,
            eventType,
            version: eventDef.version,
            fanoutCompleted: false,
            payload,
            correlationId: options?.correlationId,
            idempotencyKey: options?.idempotencyKey,
            metadata: options?.metadata,
        });

        await this.eventRepo.save(event);
        this.logger.log(`Event logged: ${eventType} | Tenant: ${tenantId} | Actor: ${actorId}`);

        // if webhookEnabled, trigger fanout (async, don't await)
        if (eventDef.webhookEnabled) {
            try {
                await this.eventFanoutService.fanout(event);
                event.fanoutCompleted = true;
                await this.eventRepo.save(event);
                this.logger.log(`Event fanout completed: ${event.id}`);
            } catch (err: any) {
                this.logger.error(`Failed to fan-out event ${event.id}: ${err.message}`);
            }
        }
        return event;
    }


    async enqueueReplayBatch(limit = 100) {
        const failures = await this.eventFailureRepo.find({
            where: { replayed: false },
            take: limit,
        });

        for (const failure of failures) {
            await this.replayQueue.add('replay-failure', {
                failureId: failure.id,
            });
        }
    }

    async getTenantEvents(tenantId: number, limit = 50): Promise<EventEntity[]> {
        if (!tenantId) {
            throw new Error('Tenant ID is required to fetch events');
        }
        const tenantEvents = await this.eventRepo.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        if (!tenantEvents) {
            throw new Error(`No events found for tenant ID: ${tenantId}`);
        }
        return tenantEvents;
    }

    async getEventById(eventId: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { id: eventId } });
        if (!event) {
            throw new Error(`Event not found: ${eventId}`);
        }
        return event;
    }

}
