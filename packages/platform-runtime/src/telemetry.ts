/**
 * Telemetry - In-memory telemetry collector
 */

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export interface TelemetryMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
}

export interface Telemetry {
  trackEvent(event: TelemetryEvent): void;
  trackMetric(metric: TelemetryMetric): void;
  getEvents(name?: string): TelemetryEvent[];
  getMetrics(name?: string): TelemetryMetric[];
  clear(): void;
}

export function createTelemetry(maxEvents = 1000, maxMetrics = 1000): Telemetry {
  const events: TelemetryEvent[] = [];
  const metrics: TelemetryMetric[] = [];

  return {
    trackEvent(event: TelemetryEvent) {
      events.push({ ...event, timestamp: event.timestamp || new Date() });
      if (events.length > maxEvents) events.shift();
    },

    trackMetric(metric: TelemetryMetric) {
      metrics.push({ ...metric, timestamp: metric.timestamp || new Date() });
      if (metrics.length > maxMetrics) metrics.shift();
    },

    getEvents(name?: string) {
      if (name) return events.filter((e) => e.name === name);
      return [...events];
    },

    getMetrics(name?: string) {
      if (name) return metrics.filter((m) => m.name === name);
      return [...metrics];
    },

    clear() {
      events.length = 0;
      metrics.length = 0;
    },
  };
}
