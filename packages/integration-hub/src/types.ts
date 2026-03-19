/**
 * Event Bus Types
 */

export interface Event {
  id: string;
  type: string;
  source: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  timestamp: Date;
}

export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  filter?: (event: Event) => boolean;
  active: boolean;
}

export type EventHandler = (event: Event) => Promise<void> | void;

export interface EventBusOptions {
  enableIdempotency?: boolean;
  idempotencyTTL?: number; // ms
  enableFanOut?: boolean;
  maxConcurrency?: number;
}

export interface PublishResult {
  success: boolean;
  delivered?: number;
  error?: string;
}
