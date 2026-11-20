/**
 * Event Bus Implementation
 */

import type { Event, EventSubscription, EventHandler, EventBusOptions, PublishResult } from "./types";

export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private idempotencyCache: Map<string, Date> = new Map();
  private readonly options: Required<EventBusOptions>;

  constructor(options: EventBusOptions = {}) {
    this.options = {
      enableIdempotency: options.enableIdempotency ?? true,
      idempotencyTTL: options.idempotencyTTL ?? 3600000, // 1 hour
      enableFanOut: options.enableFanOut ?? true,
      maxConcurrency: options.maxConcurrency ?? 10,
    };
  }

  subscribe(eventType: string, handler: EventHandler, filter?: (event: Event) => boolean): EventSubscription {
    const subscription: EventSubscription = {
      id: crypto.randomUUID(),
      eventType,
      handler,
      filter,
      active: true,
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    this.subscriptions.set(eventType, existing);

    return subscription;
  }

  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(eventType);
        }
        return true;
      }
    }
    return false;
  }

  async publish(event: Event): Promise<PublishResult> {
    // Idempotency check
    if (this.options.enableIdempotency && event.idempotencyKey) {
      if (this.isIdempotent(event.idempotencyKey)) {
        return { success: true, delivered: 0 };
      }
      this.markIdempotent(event.idempotencyKey);
    }

    const eventType = event.type;
    const subs = this.subscriptions.get(eventType) || [];

    if (subs.length === 0) {
      return { success: true, delivered: 0 };
    }

    // Filter active subscriptions
    const activeSubs = subs.filter((s) => s.active && (!s.filter || s.filter(event)));

    if (activeSubs.length === 0) {
      return { success: true, delivered: 0 };
    }

    if (this.options.enableFanOut) {
      // Fan-out: deliver to all subscribers concurrently
      const results = await Promise.allSettled(
        activeSubs.map((sub) => sub.handler(event))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return {
        success: failed === 0,
        delivered: activeSubs.length - failed,
        error: failed > 0 ? `${failed} handlers failed` : undefined,
      };
    } else {
      // Sequential delivery
      let delivered = 0;
      for (const sub of activeSubs) {
        try {
          await sub.handler(event);
          delivered++;
        } catch {
          // Continue to next handler
        }
      }
      return { success: true, delivered };
    }
  }

  private isIdempotent(key: string): boolean {
    const timestamp = this.idempotencyCache.get(key);
    if (!timestamp) return false;
    if (Date.now() - timestamp.getTime() > this.options.idempotencyTTL) {
      this.idempotencyCache.delete(key);
      return false;
    }
    return true;
  }

  private markIdempotent(key: string): void {
    this.idempotencyCache.set(key, new Date());
    // Cleanup old entries periodically
    if (this.idempotencyCache.size > 10000) {
      const now = Date.now();
      for (const [k, v] of this.idempotencyCache.entries()) {
        if (now - v.getTime() > this.options.idempotencyTTL) {
          this.idempotencyCache.delete(k);
        }
      }
    }
  }

  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      return this.subscriptions.get(eventType)?.length || 0;
    }
    let total = 0;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }
}
