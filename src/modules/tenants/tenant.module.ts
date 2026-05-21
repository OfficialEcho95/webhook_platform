import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from './tenant.entity';
import { TenantService } from './tenant.service';
import { PaymentController } from './tenant.subscription';
import { UserModule } from '../../modules/users/user.module';
import { EventModule } from '../events/event.module';
import { PaystackWebhookHandler } from '../payment/service/paystack.webhook';
import { PaymentModule } from '../payment/module/payment.module';
import { TenantInvitationEntity } from './tenantInvitation.entity';
import { UserEntity } from '../users/user.entity';
import { TenantController } from './tenant.controller';
import { TenantQueueModule } from '../shared/background_runners/queues/queue.module';
import { ApiKeyModule } from '../api-keys/api-key.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TenantEntity, TenantInvitationEntity, UserEntity]),
        forwardRef(() => UserModule),
        EventModule,
        TenantQueueModule,
        ApiKeyModule,
        forwardRef(() => PaymentModule),
    ],
    providers: [TenantService,],
    controllers: [PaymentController, TenantController],
    exports: [TenantService,], // 🔑 used by PaymentModule
})
export class TenantModule { }
