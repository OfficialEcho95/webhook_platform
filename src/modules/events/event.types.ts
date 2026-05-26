export type EventCategory =
  | 'tenant'
  | 'membership'
  | 'billing'
  | 'invitation'
  | 'auth'
  | 'webhook'
  | 'system'
  | 'security';

export interface EventDefinition<
  Payload = Record<string, any>,
> {
  // stable identifier for the event type (e.g., "user.created")
  version: number;

  description: string;

  // logical grouping for UI/exploration
  category: EventCategory;

  // Whether event can be replayed (e.g., for new webhook subscriptions)
  replayable: boolean;

 // whether event can trigger webhooks
  webhookEnabled: boolean;

  // payload validator
  validate(payload: Payload): boolean;
}