import { Body, Controller, Post } from "@nestjs/common";
import { WebhookService } from "./webhook.service";
import { CreateWebhookDto } from "./dto/create-webhook.dto";

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('setup')
  async setupWebhook(
    @Body('tenantId') createWebhookDto: CreateWebhookDto
  ) {
    return this.webhookService.createWebhook(createWebhookDto);
  }
}