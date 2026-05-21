import { Worker } from 'bullmq';
import { transporter } from 'nodemailer.setup';
import { RedisServer } from 'redisServer';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { TenantEventType } from '../queues/tenant.queue';

interface TenantJobData {
  tenantId: number;
  ownerId?: number;
  userId?: number;
  invitedBy?: number;
  email?: string;
  message?: string;
  newPlan?: string;
}

@Injectable()
export class TenantWorkers implements OnModuleDestroy{
  private readonly logger = new Logger(TenantWorkers.name);
  public tenantWorker: Worker;

  constructor(private redisServer: RedisServer) {
    this.tenantWorker = new Worker(
      'tenant',
      async (job) => {
        try {
          const data: TenantJobData = job.data;

          switch (job.name) {
            case TenantEventType.CREATION:
              return this.tenantCreation(data);
            case TenantEventType.ADD_USER:
              return this.addUserToTenant(data);
            case TenantEventType.REMOVE_USER:
              return this.removeUserFromTenant(data);
            case TenantEventType.DELETION:
              return this.tenantDeletion(data);
            case TenantEventType.PLAN_UPGRADE:
              return this.tenantPlanUpgrade(data);
            case TenantEventType.PLAN_DOWNGRADE:
              return this.tenantPlanDowngrade(data);
            case TenantEventType.INVITE_USER:
              return this.inviteUserToTenant(data);
            case TenantEventType.ACCEPT_INVITATION:
              return this.acceptTenantInvitation(data);
            default:
              this.logger.warn(`No handler for job name: ${job.name}`);
          }
        } catch (error) {
          this.logger.error(`Error processing job ${job.name}`, error);
          throw error; // Let BullMQ retry if configured
        }
      },
      {
        connection: this.redisServer.getConnection(),
        concurrency: 5,
      }
    );

    this.tenantWorker.on('completed', (job) => {
      this.logger.log(`Tenant job ${job.name} completed (ID: ${job.id})`);
    });

    this.tenantWorker.on('failed', (job, err) => {
      this.logger.error(`Tenant job ${job?.name} failed (ID: ${job?.id})`, err);
    });
  }

  // ==========================
  // Worker Handlers with Validation & Unique Messages
  // ==========================

  private async tenantCreation({ tenantId, ownerId, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('tenantCreation', tenantId);
    const subject = 'Webhook Platform: Tenant Created';
    const message = `Tenant #${tenantId} has been successfully created in the webhook platform. Admin ID: ${ownerId}.`;
    await this.sendEmail(email, subject, message);
  }

  private async addUserToTenant({ tenantId, userId, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('addUserToTenant', tenantId, userId);
    const subject = 'Webhook Platform: User Added';
    const message = `User #${userId} has been added to Tenant #${tenantId}. They now have access to tenant's webhook subscriptions and event logs.`;
    await this.sendEmail(email, subject, message);
  }

  private async removeUserFromTenant({ tenantId, userId, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('removeUserFromTenant', tenantId, userId);
    const subject = 'Webhook Platform: User Removed';
    const message = `User #${userId} has been removed from Tenant #${tenantId}. Access to webhook resources has been revoked.`;
    await this.sendEmail(email, subject, message);
  }

  private async tenantDeletion({ tenantId, ownerId, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('tenantDeletion', tenantId);
    const subject = 'Webhook Platform: Tenant Deleted';
    const message = `Tenant #${tenantId} has been deleted by Admin ID: ${ownerId}. All associated webhook subscriptions and events have been removed.`;
    await this.sendEmail(email, subject, message);
  }

  private async tenantPlanUpgrade({ tenantId, newPlan, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('tenantPlanUpgrade', tenantId);
    const subject = 'Webhook Platform: Plan Upgraded';
    const message = `Tenant #${tenantId} has been upgraded to the ${newPlan} plan. Higher webhook delivery limits and premium features are now active.`;
    await this.sendEmail(email, subject, message);
  }

  private async tenantPlanDowngrade({ tenantId, newPlan, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('tenantPlanDowngrade', tenantId);
    const subject = 'Webhook Platform: Plan Downgraded';
    const message = `Tenant #${tenantId} has been downgraded to the ${newPlan} plan. Some premium webhook features may no longer be available.`;
    await this.sendEmail(email, subject, message);
  }

  private async inviteUserToTenant({ tenantId, email, invitedBy }: TenantJobData) {
    if (!email) return this.logMissingEmail('inviteUserToTenant', tenantId);
    const subject = 'Webhook Platform: Tenant Invitation';
    const message = `You have been invited to join Tenant #${tenantId} by User ID: ${invitedBy}. Accept the invitation to manage webhook subscriptions and events.`;
    await this.sendEmail(email, subject, message);
  }

  private async acceptTenantInvitation({ tenantId, userId, email }: TenantJobData) {
    if (!email) return this.logMissingEmail('acceptTenantInvitation', tenantId, userId);
    const subject = 'Webhook Platform: Invitation Accepted';
    const message = `User #${userId} has accepted the invitation to join Tenant #${tenantId}. Access to webhook subscriptions and events is now active.`;
    await this.sendEmail(email, subject, message);
  }

  // ==========================
  // Helper Methods
  // ==========================

  private async sendEmail(to: string, subject: string, text: string) {
    try {
      await transporter.sendMail({
        from: '"Webhook Platform" <no-reply@webhookplatform.com>',
        to,
        subject,
        text,
      });
      console.log(`Email sent to ${to} | Subject: ${subject}`);
    
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error; // Allow BullMQ to retry according to queue settings
    }
  }

  private logMissingEmail(handler: string, tenantId: number, userId?: number) {
    const msg = userId
      ? `Missing email for ${handler} | Tenant: ${tenantId}, User: ${userId}`
      : `Missing email for ${handler} | Tenant: ${tenantId}`;
    this.logger.warn(msg);
  }
    
    async onModuleDestroy() {
    this.logger.log('Shutting down Tenant Worker...');
    await this.tenantWorker.close();
    }
}
