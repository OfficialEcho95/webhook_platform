import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { createHmac } from 'crypto';

@Processor('webhook-delivery')
export class WebhookProcessor {
  
  @Process('send-webhook')
  async handleWebhookDelivery(job: Job) {
    const { url, secret, event, payload } = job.data;
    const timestamp = Date.now();
    const body = JSON.stringify({ event, payload, timestamp });

    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp.toString(),
      },
      body,
    });

    if (!response.ok) {
      // If we throw an error, Bull will automatically retry based on the backoff config
      throw new Error(`Delivery failed with status ${response.status}`);
    }

    return { success: true };
  }
}