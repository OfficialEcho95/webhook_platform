import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export enum TenantEventType {
  CREATION = 'TENANT.CREATION',
  DELETION = 'TENANT.DELETION',
  PLAN_UPGRADE = 'TENANT.PLAN_UPGRADE',
  PLAN_DOWNGRADE = 'TENANT.PLAN_DOWNGRADE',
  ADD_USER = 'TENANT.ADD_USER',
  REMOVE_USER = 'TENANT.REMOVE_USER',
  INVITE_USER = 'TENANT.INVITE_USER',
  ACCEPT_INVITATION = 'TENANT.ACCEPT_INVITATION',
}

@Injectable()
export class QueueTenant {
  private tenantQueue: Queue;
  private defaultJobOptions: JobsOptions;

  constructor(private redisServer: RedisServer) {
    // Queue options
    const queueOptions: QueueOptions = {
      connection: this.redisServer.getConnection(),
      defaultJobOptions: {
        attempts: 3, // retry 3 times on failure
        backoff: { type: 'exponential', delay: 5000 }, // exponential backoff
        removeOnComplete: true, // clean up completed jobs
        removeOnFail: false, // keep failed jobs for inspection
      },
    };

    this.tenantQueue = new Queue('tenant', queueOptions);

    // Optional: save default job options for enqueue convenience
    this.defaultJobOptions = queueOptions.defaultJobOptions!;
  }

  // Generic enqueue method with metadata
  private async enqueue(eventType: TenantEventType, payload: Record<string, any>, tenantId: number, actorId?: number) {
    try {
      const jobId = uuidv4(); // unique ID for tracing
      const jobPayload = {
        ...payload,
        tenantId,
        actorId: actorId || null,
        timestamp: new Date().toISOString(),
        requestId: jobId,
      };

      return await this.tenantQueue.add(eventType, jobPayload, this.defaultJobOptions);
    } catch (error) {
      // Log or handle enqueue error
      console.error(`Failed to enqueue tenant event ${eventType}`, error);
      // Optionally, rethrow or notify monitoring system
    }
  }

  // Event methods
  async queueTenantCreation(tenantId: number, ownerId: number, email: string, message: string) {
    return await this.enqueue(TenantEventType.CREATION, { ownerId, email, message }, tenantId, ownerId);
  }

  async queueTenantDeletion(tenantId: number, ownerId: number, email: string, message: string) {
    await this.enqueue(TenantEventType.DELETION, { ownerId, email, message }, tenantId, ownerId);
  }

  async queueTenantPlanUpgrade(tenantId: number, newPlan: string, email: string, message: string) {
    await this.enqueue(TenantEventType.PLAN_UPGRADE, { newPlan, email, message }, tenantId);
  }

  async queueTenantPlanDowngrade(tenantId: number, newPlan: string, email: string, message: string) {
    await this.enqueue(TenantEventType.PLAN_DOWNGRADE, { newPlan, email, message }, tenantId);
  }

  async addUserToTenant(tenantId: number, userId: number, email: string, message: string) {
    await this.enqueue(TenantEventType.ADD_USER, { userId, email, message }, tenantId, userId);
  }

  async removeUserFromTenant(tenantId: number, userId: number, email: string, message: string) {
    await this.enqueue(TenantEventType.REMOVE_USER, { userId, email, message }, tenantId, userId);
  }

  async queueInviteUserToTenant(tenantId: number, email: string, invitedBy: number, message: string) {
    await this.enqueue(TenantEventType.INVITE_USER, { email, invitedBy, message }, tenantId, invitedBy);
  }

  async queueAcceptTenantInvitation(tenantId: number, userId: number, message: string) {
    await this.enqueue(TenantEventType.ACCEPT_INVITATION, { userId, message }, tenantId, userId);
  }
}
