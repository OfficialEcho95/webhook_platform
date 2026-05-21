import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WebhookEntity } from "./webhook.entity";
import { createHmac, randomBytes } from "crypto";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";


@Injectable()
export class WebhookService {
    constructor(
        @InjectRepository(WebhookEntity)
        private readonly webhookRepo: Repository<WebhookEntity>,
        @InjectQueue('webhook-delivery') private readonly webhookQueue: Queue,
    ) { }

    @OnEvent('tenant.*')
    async handleTenantEvents(payload: any, event: string) {
        const webhook = await this.webhookRepo.findOne({
            where: {
                tenantId: payload.tenantId
            }
        });
        if (!webhook) return;

        // Add to Bull Queue
        await this.webhookQueue.add('send-webhook', {
            url: webhook.targetUrl,
            secret: webhook.secret,
            event: event.replace('.', '_').toUpperCase(),
            payload,
        }, {
            attempts: 5, // Retry 5 times if it fails
            backoff: {
                type: 'exponential',
                delay: 5000, // Wait 5s, then 10s, 20s...
            },
            removeOnComplete: true, // Keep Redis clean
        });
    }


    // This is called by other services (e.g., TenantService)
    async createWebhook(dto: CreateWebhookDto) {
        const secret = `whsec_${randomBytes(24).toString('hex')}`;
        const webhook = this.webhookRepo.create({ ...dto, secret });
        return this.webhookRepo.save(webhook);
    }
}