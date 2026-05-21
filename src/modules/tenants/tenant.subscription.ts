import {
  Controller,
  Post,
  Get,
  Req,
  Query,
  BadRequestException,
  Param,
  ParseIntPipe,
  Body,
  Headers,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";
import { PaystackWebhookHandler } from "../payment/service/paystack.webhook";
import { TenantEntity, TenantPlan } from "../tenants/tenant.entity";
import { PaystackService } from "../payment/service/payment.gateway";
import { AuthGuard } from "@nestjs/passport";
import { TenantGuard } from "../shared/guards/tenant.guard";
import { Public } from "../shared/decorators/public.decorators";
import { SkipTenant } from "../shared/decorators/skip-tenant.decorator";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Controller("payments")

// @UseGuards(TenantGuard)
export class PaymentController {
  constructor(
    private readonly paystackWebhookHandler: PaystackWebhookHandler,
    private readonly configService: ConfigService,
    private readonly paymentService: PaystackService,
    @InjectRepository(TenantEntity) private readonly tenantRepo: Repository<TenantEntity>,
  ) { }

  /**
   * Initiate tenant upgrade payment
   */
  @Post(":tenantId/upgrade")
  @UseGuards(AuthGuard("jwt")) // Must be authenticated to initiate upgrade
  @SkipTenant() // Skip tenant guard for upgrade initiation
  async initiateUpgrade(
    @Param("tenantId", ParseIntPipe) tenantId: number,
    @Body("plan") plan: TenantPlan,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    //check if user is a member of the tenant
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['users'],
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const isMember = tenant.users.some((u) => u.id === user.id);
    if (!isMember) {
      throw new BadRequestException('User is not a member of this tenant');
    }

    return this.paymentService.initializeTenantUpgrade(
      tenantId,
      plan,
      user.id,
      user.email,
    );
  }

  /**
   * Paystack webhook (NO AUTH)
   */
  @Post("webhooks/paystack")
  @Public()
  async handlePaystackWebhook(
    @Req() req: Request & { rawBody: Buffer },
    @Headers("x-paystack-signature") signature: string,
  ) {
    if (!signature) {
      throw new UnauthorizedException('No signature header received');
    }
    const secret = this.configService.get<string>("PAYSTACK_SECRET_KEY");

    if (!secret) {
      throw new UnauthorizedException("Paystack secret key is not configured");
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");
    if (hash !== signature) {
      throw new UnauthorizedException("Invalid Paystack signature");
    }

    const event = JSON.parse(req.rawBody.toString());

    return this.paystackWebhookHandler.handleWebhook(event);
  }

  @Get('callback')
  @Public()
  async handleCallback(@Query('reference') reference: string) {
    if (!reference) {
      throw new BadRequestException('Payment reference is missing');
    }

    console.log('Calling the callback endpoint with reference:', reference);

    // 1. Verify payment with Paystack
    const verification = await this.paymentService.verifyPayment(reference);

    if (!verification.status) {
      throw new BadRequestException('Payment verification failed');
    }

    // 2. Return result (or redirect frontend)
    console.log('Payment verified successfully:', verification.data);

    return {
      message: 'Payment verified successfully',
      data: verification.data,
    };
  }



  @Post(':tenantId/verify')
  @SkipTenant()
  async manualVerify(
    @Body('reference') reference: string,
  ) {
    return this.paymentService.verifyPayment(reference);
  }
}
