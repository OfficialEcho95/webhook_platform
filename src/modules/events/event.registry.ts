import { EventDefinition } from './event.types';

export const EVENT_REGISTRY: Record<
  string,
  EventDefinition
> = {
  /**
   * ======================================================
   * TENANT EVENTS
   * ======================================================
   */

  'TENANT.CREATED': {
    version: 1,

    category: 'tenant',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when a tenant is created.',

    validate(payload) {
      return (
        typeof payload.tenantId ===
          'number' &&
        typeof payload.ownerId ===
          'number'
      );
    },
  },

  'TENANT.DELETED': {
    version: 1,

    category: 'tenant',

    replayable: false,

    webhookEnabled: true,

    description:
      'Triggered when a tenant is deleted.',

    validate(payload) {
      return (
        typeof payload.tenantId ===
        'number'
      );
    },
  },

  'TENANT.UPDATED': {
    version: 1,

    category: 'tenant',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when tenant metadata changes.',

    validate(payload) {
      return (
        typeof payload.tenantId ===
        'number'
      );
    },
  },

  /**
   * ======================================================
   * MEMBERSHIP EVENTS
   * ======================================================
   */

  'TENANT.USER_ADDED': {
    version: 1,

    category: 'membership',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when user joins tenant.',

    validate(payload) {
      return (
        typeof payload.userId ===
        'number'
      );
    },
  },

  'TENANT.USER_REMOVED': {
    version: 1,

    category: 'membership',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when user is removed from tenant.',

    validate(payload) {
      return (
        typeof payload.userId ===
        'number'
      );
    },
  },

  'TENANT.OWNER_TRANSFERRED': {
    version: 1,

    category: 'membership',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when ownership changes.',

    validate(payload) {
      return (
        typeof payload.oldOwnerId ===
          'number' &&
        typeof payload.newOwnerId ===
          'number'
      );
    },
  },

  /**
   * ======================================================
   * BILLING EVENTS
   * ======================================================
   */

  'PLAN.UPGRADED': {
    version: 1,

    category: 'billing',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when plan is upgraded.',

    validate(payload) {
      return (
        typeof payload.oldPlan ===
          'string' &&
        typeof payload.newPlan ===
          'string'
      );
    },
  },

  'PLAN.DOWNGRADED': {
    version: 1,

    category: 'billing',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when plan is downgraded.',

    validate(payload) {
      return (
        typeof payload.oldPlan ===
          'string' &&
        typeof payload.newPlan ===
          'string'
      );
    },
  },

  'SUBSCRIPTION.CANCELLED': {
    version: 1,

    category: 'billing',

    replayable: false,

    webhookEnabled: true,

    description:
      'Triggered when subscription is cancelled.',

    validate(payload) {
      return (
        typeof payload.subscriptionId ===
        'string'
      );
    },
  },

  /**
   * ======================================================
   * INVITATION EVENTS
   * ======================================================
   */

  'INVITATION.SENT': {
    version: 1,

    category: 'invitation',

    replayable: false,

    webhookEnabled: true,

    description:
      'Triggered when invitation is sent.',

    validate(payload) {
      return (
        typeof payload.email ===
        'string'
      );
    },
  },

  'INVITATION.ACCEPTED': {
    version: 1,

    category: 'invitation',

    replayable: true,

    webhookEnabled: true,

    description:
      'Triggered when invitation is accepted.',

    validate(payload) {
      return (
        typeof payload.userId ===
        'number'
      );
    },
  },

  'INVITATION.REVOKED': {
    version: 1,

    category: 'invitation',

    replayable: false,

    webhookEnabled: true,

    description:
      'Triggered when invitation is revoked.',

    validate(payload) {
      return (
        typeof payload.invitationId ===
        'string'
      );
    },
  },

  /**
   * ======================================================
   * AUTH EVENTS
   * ======================================================
   */

  'AUTH.LOGIN_SUCCEEDED': {
    version: 1,

    category: 'auth',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered after successful login.',

    validate(payload) {
      return (
        typeof payload.userId ===
        'number'
      );
    },
  },

  'AUTH.LOGIN_FAILED': {
    version: 1,

    category: 'security',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered after failed login.',

    validate(payload) {
      return (
        typeof payload.email ===
        'string'
      );
    },
  },

  /**
   * ======================================================
   * WEBHOOK EVENTS
   * ======================================================
   */

  'WEBHOOK.DELIVERY_SUCCEEDED': {
    version: 1,

    category: 'webhook',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered after successful webhook delivery.',

    validate(payload) {
      return (
        typeof payload.deliveryId ===
        'number'
      );
    },
  },

  'WEBHOOK.DELIVERY_FAILED': {
    version: 1,

    category: 'webhook',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered after failed webhook delivery.',

    validate(payload) {
      return (
        typeof payload.deliveryId ===
        'number'
      );
    },
  },

  /**
   * ======================================================
   * SYSTEM EVENTS
   * ======================================================
   */

  'SYSTEM.MAINTENANCE_STARTED': {
    version: 1,

    category: 'system',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered when maintenance starts.',

    validate(payload) {
      return (
        typeof payload.startedBy ===
        'number'
      );
    },
  },

  'SYSTEM.MAINTENANCE_COMPLETED': {
    version: 1,

    category: 'system',

    replayable: false,

    webhookEnabled: false,

    description:
      'Triggered when maintenance completes.',

    validate(payload) {
      return (
        typeof payload.completedBy ===
        'number'
      );
    },
  },
};