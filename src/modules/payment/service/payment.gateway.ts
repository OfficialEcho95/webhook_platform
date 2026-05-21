import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentEntity } from "../entity/payment.entity";
import { TenantPlan } from "../../tenants/tenant.entity";
import { v4 as uuidv4 } from "uuid";
import { TenantService } from "../../tenants/tenant.service";

@Injectable()
export class PaystackService {
    private readonly baseUrl = "https://api.paystack.co";

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @InjectRepository(PaymentEntity)
        private readonly paymentRepository: Repository<PaymentEntity>,
        private readonly tenantService: TenantService,
    ) { }

    /** PLAN PRICING (kobo handled later) */
    private readonly planPricing: Record<TenantPlan, number> = {
        free: 0,
        pro: 5000,
        enterprise: 15000,
    };

    async initializeTenantUpgrade(
        tenantId: number,
        plan: TenantPlan,
        userId: number,
        email: string,
    ) {
        if (!this.planPricing[plan] || plan === TenantPlan.FREE) {
            throw new BadRequestException("Invalid upgrade plan");
        }

        const amount = this.planPricing[plan];
        const reference = uuidv4();

        const payment = this.paymentRepository.create({
            tenantId,
            currency: "NGN",
            plan,
            amount,
            reference,
            verified: false,
            userId, // initiator of upgrade
        });

        await this.paymentRepository.save(payment);

        return this.initializePayment({
            amount,
            email,
            reference,
            metadata: {
                tenantId,
                plan,
                paymentId: payment.id,
            },
        });
    }

    private async initializePayment(payload: {
        amount: number;
        email: string;
        reference: string;
        metadata: Record<string, any>;
    }) {
        const response = await firstValueFrom(
            this.httpService.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    amount: payload.amount * 100, // kobo
                    email: payload.email,
                    reference: payload.reference,
                    metadata: payload.metadata,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.configService.get<string>(
                            "PAYSTACK_SECRET_KEY",
                        )}`,
                        "Content-Type": "application/json",
                    },
                },
            ),
        );

        return response.data;
    }

      async verifyPayment(reference: string) {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/transaction/verify/${reference}`,
            {
              headers: {
                Authorization: `Bearer ${this.configService.get<string>(
                  "PAYSTACK_SECRET_KEY",
                )}`,
              },
            },
          ),
        );
        return response.data;
      }



    // async verifyPayment(reference: string) {
    //     // 1️⃣ Verify with Paystack
    //     const response = await firstValueFrom(
    //         this.httpService.get(`${this.baseUrl}/transaction/verify/${reference}`, {
    //             headers: {
    //                 Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
    //             },
    //         }),
    //     );

    //     const data = response.data;

    //     // 2️⃣ Check if payment succeeded
    //     if (data.status && data.data.status === 'success') {
    //         // 3️⃣ Find the payment in your DB
    //         const payment = await this.paymentRepository.findOne({
    //             where: { reference },
    //         });

    //         if (!payment) {
    //             throw new Error('Payment not found in database');
    //         }

    //         if (!payment.verified) {
    //             // 4️⃣ Mark as verified
    //             payment.verified = true;
    //             await this.paymentRepository.save(payment);

    //             // 5️⃣ Upgrade tenant plan
    //             await this.tenantService.upgradeTenantPlan(payment.tenantId, payment.plan);
    //         }

    //         return { verified: true, message: 'Payment verified and tenant upgraded' };
    //     }

    //     return { verified: false, message: 'Payment not successful yet' };
    // }

}
