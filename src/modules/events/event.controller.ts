import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { EventEntity } from './event.entity';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Get all events for a tenant
  @Get('tenant/:tenantId')
  async getTenantEvents(
    @Param('tenantId') tenantId: number,
    @Query('limit') limit?: number,
  ): Promise<EventEntity[]> {
    return this.eventService.getTenantEvents(tenantId, limit);
  }

  // Get a specific event by ID
  @Get(':eventId')
  async getEventById(@Param('eventId') eventId: string): Promise<EventEntity> {
    return this.eventService.getEventById(eventId);
  }
}
