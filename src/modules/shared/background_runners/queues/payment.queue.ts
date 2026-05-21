import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class PaymentQueue {
  public paymentQueue: Queue;

  constructor(private redisServer: RedisServer) {
    this.paymentQueue = new Queue('payment', {
      connection: this.redisServer.getConnection(),
    });
  }

  async queuePaymentProcessing(orderId: number, amount: number) {
    await this.paymentQueue.add('process-payment', { orderId, amount });
  }

  async queuePaymentVerification(transactionRef: string) {
    await this.paymentQueue.add('verify-transaction', { transactionRef });
  }

  async queueRefund(orderId: number, reason: string) {
    await this.paymentQueue.add('refund', { orderId, reason });
  }
}
