/**
 * Integration Hub - Event Bus
 *
 * Central event bus for platform integrations with support for:
 * - Event subscriptions
 * - Idempotency
 * - Fan-out
 * - Webhook delivery
 */

export { EventBus } from "./event-bus";
export type { Event, EventSubscription, EventHandler } from "./types";
