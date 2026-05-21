import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentEntity } from "../entity/payment.entity";
import { TenantService } from "../../tenants/tenant.service";
import { Injectable } from "@nestjs/common";
import { ApiKeyService } from "src/modules/api-keys/api-key.service";

@Injectable()
export class PaystackWebhookHandler {
    constructor(
        @InjectRepository(PaymentEntity) private paymentRepository: Repository<PaymentEntity>,
        private readonly tenantService: TenantService,
        private readonly apiKeyService: ApiKeyService
    ) { }
    async handleWebhook(event: any) {
        if (event.event !== 'charge.success') {
            return { received: true };
        }

        const { reference, metadata } = event.data;

        const payment = await this.paymentRepository.findOne({
            where: { reference },
        });

        if (!payment || payment.verified) {
            return { received: true };
        }

        payment.verified = true;
        await this.paymentRepository.save(payment);


        await this.tenantService.upgradeTenantPlan(
            payment.tenantId,
            payment.plan,
        );

        

        console.log(`Payment verified for tenant ${payment.tenantId}, plan ${payment.plan}.`);

        return { received: true };
    }
}