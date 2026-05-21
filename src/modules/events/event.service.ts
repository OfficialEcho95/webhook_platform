import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from './event.repository';
import { EventEntity } from './event.entity';
import { v4 as uuidv4 } from 'uuid';
import { EventFanoutService } from './event.event-fanout.service';

export enum EventType {
    TENANT_CREATED = 'TENANT.CREATED',
    TENANT_DELETED = 'TENANT.DELETED',
    USER_ADDED = 'USER.ADDED',
    USER_REMOVED = 'USER.REMOVED',
    PLAN_UPGRADED = 'PLAN.UPGRADED',
    PLAN_DOWNGRADED = 'PLAN.DOWNGRADED',
    INVITATION_SENT = 'INVITATION.SENT',
    INVITATION_ACCEPTED = 'INVITATION.ACCEPTED',
    WEBHOOK_TRIGGERED = 'WEBHOOK.TRIGGERED',
}

@Injectable()
export class EventService {
    private readonly logger = new Logger(EventService.name);

    constructor(
        private readonly eventRepo: EventRepository,
        private readonly eventFanoutService: EventFanoutService
    ) { }

    async logEvent(
        tenantId: number,
        eventType: EventType | string,
        payload: Record<string, any>,
        actorId?: number,
    ): Promise<EventEntity> {
        const event = this.eventRepo.create({
            id: uuidv4(),
            tenantId,
            actorId: actorId || undefined,
            eventType,
            payload,
        });

        await this.eventRepo.save(event);
        this.logger.log(`Event logged: ${eventType} | Tenant: ${tenantId} | Actor: ${actorId}`);

        try {
            await this.eventFanoutService.fanout(event);
        } catch (err: any) {
            this.logger.error(`Failed to fan-out event ${event.id}: ${err.message}`);
        }

        return event;
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
