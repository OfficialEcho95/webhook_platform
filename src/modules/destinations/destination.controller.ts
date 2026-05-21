import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DestinationService } from '../destinations/destination.service';

@Controller('destinations')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Post()
  create(@Body() body: any) {
    return this.destinationService.create(body);
  }

  @Get('tenant/:tenantId/event/:eventType')
  findForEvent(
    @Param('tenantId') tenantId: number,
    @Param('eventType') eventType: string,
  ) {
    return this.destinationService.findActiveForEvent(
      tenantId,
      eventType,
    );
  }
}
