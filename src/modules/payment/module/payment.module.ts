import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from '../entity/payment.entity';
import { PaystackWebhookHandler } from '../service/paystack.webhook';
import { TenantModule } from '../../tenants/tenant.module';
import { PaystackService } from '../service/payment.gateway';
import { HttpModule } from '@nestjs/axios';
import { TenantEntity } from 'src/modules/tenants/tenant.entity';
import { ApiKeyModule } from 'src/modules/api-keys/api-key.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, TenantEntity]),
     forwardRef(() => TenantModule),  // to inject TenantService
      HttpModule, // For making HTTP requests to Paystack
      ApiKeyModule, // To use ApiKeyService for API key creation
  ],
  providers: [PaystackWebhookHandler, PaystackService],
  exports: [PaystackWebhookHandler, PaystackService], // So TenantModule can use it
})
export class PaymentModule {}
 