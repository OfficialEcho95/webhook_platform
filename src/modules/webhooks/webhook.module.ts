import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookService } from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { WebhookEntity } from "./webhook.entity";
import { WebhookProcessor } from "./webhook.worker";
import { BullModule } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEntity]),
  BullModule.registerQueue({ name: 'webhook-delivery' })],
  providers: [WebhookService, WebhookProcessor],
  controllers: [WebhookController],
  exports: [WebhookService], // Important! Other modules need this to send events
})
export class WebhookModule { }