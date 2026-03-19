/**
 * Realtime Router
 *
 * Server-Sent Events (SSE) for real-time updates:
 * - Monitoring dashboards
 * - Helpdesk tickets
 * - Chat messages
 * - Notifications
 * - Agent executions
 * - Workflow progress
 */

import { z } from "zod";
import { pub } from "../procedures";

// Event types
export type RealtimeEvent =
  | "monitoring:dashboard"
  | "monitoring:alert"
  | "helpdesk:ticket_created"
  | "helpdesk:ticket_updated"
  | "helpdesk:ticket_assigned"
  | "chat:message"
  | "chat:typing"
  | "notification:new"
  | "agent:execution_started"
  | "agent:execution_complete"
  | "agent:execution_error"
  | "workflow:step_complete"
  | "workflow:complete"
  | "workflow:error";

// Client registry with organization-scoped subscriptions
interface SSEClient {
  id: string;
  organizationId?: string;
  controller: ReadableStreamDefaultController;
  events: Set<RealtimeEvent>;
}

const clients = new Map<string, SSEClient>();

// Generate unique client ID
function generateClientId(): string {
  return `sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Event payload types
interface EventPayload {
  "monitoring:dashboard": { metrics: Record<string, number>; timestamp: Date };
  "monitoring:alert": { level: string; message: string; timestamp: Date };
  "helpdesk:ticket_created": { ticketId: string; subject: string };
  "helpdesk:ticket_updated": { ticketId: string; status: string };
  "helpdesk:ticket_assigned": { ticketId: string; assigneeId: string };
  "chat:message": { conversationId: string; message: { id: string; role: string; content: string } };
  "chat:typing": { conversationId: string; userId: string; isTyping: boolean };
  "notification:new": { id: string; type: string; title: string; body?: string };
  "agent:execution_started": { executionId: string; agentId: string };
  "agent:execution_complete": { executionId: string; agentId: string; result: unknown };
  "agent:execution_error": { executionId: string; agentId: string; error: string };
  "workflow:step_complete": { runId: string; stepId: string; output: unknown };
  "workflow:complete": { runId: string; result: unknown };
  "workflow:error": { runId: string; error: string };
}

// Broadcast to all clients subscribed to an event in an organization
function broadcast<T extends RealtimeEvent>(
  event: T,
  payload: EventPayload[T],
  organizationId?: string
): void {
  const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  for (const [, client] of clients) {
    if (client.events.has(event)) {
      // If organizationId is specified, only send to that org
      // If client has no org filter, send to all (for admin events)
      if (!client.organizationId || client.organizationId === organizationId) {
        try {
          client.controller.enqueue(`data: ${data}\n\n`);
        } catch {
          // Client disconnected, remove it
          clients.delete(client.id);
        }
      }
    }
  }
}

export const realtimeRouter = {
  // SSE connection endpoint
  connect: pub
    .route({
      method: "GET",
      path: "/realtime/connect",
      summary: "Connect to SSE stream for real-time updates",
      tags: ["Realtime"],
    })
    .input(
      z.object({
        organizationId: z.string().optional(),
        events: z.array(z.string()).optional(),
      })
    )
    .handler(async ({ input }) => {
      const clientId = generateClientId();
      const subscribedEvents = new Set<RealtimeEvent>(
        (input.events as RealtimeEvent[]) || ["notification:new"]
      );

      const stream = new ReadableStream({
        start(controller) {
          // Register client
          clients.set(clientId, {
            id: clientId,
            organizationId: input.organizationId,
            controller,
            events: subscribedEvents,
          });

          // Send initial connection event
          const connectEvent = JSON.stringify({
            event: "connected",
            payload: { clientId, events: Array.from(subscribedEvents) },
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(`data: ${connectEvent}\n\n`);

          // Heartbeat every 30 seconds to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(`: heartbeat\n\n`);
            } catch {
              clearInterval(heartbeat);
              clients.delete(clientId);
            }
          }, 30000);
        },
        cancel() {
          clients.delete(clientId);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }),

  // Emit an event (internal API for other routers to use)
  emit: pub
    .route({
      method: "POST",
      path: "/realtime/emit",
      summary: "Emit a realtime event (internal)",
      tags: ["Realtime"],
    })
    .input(
      z.object({
        event: z.string(),
        payload: z.unknown(),
        organizationId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const event = input.event as RealtimeEvent;
      broadcast(event, input.payload as any, input.organizationId);
      return { success: true, event };
    }),

  // Get connection stats (admin only)
  getStats: pub
    .route({
      method: "GET",
      path: "/realtime/stats",
      summary: "Get realtime connection stats",
      tags: ["Realtime"],
    })
    .input(z.object({}))
    .handler(async () => {
      // Count by organization
      const byOrg = new Map<string, number>();
      for (const [, client] of clients) {
        if (client.organizationId) {
          byOrg.set(client.organizationId, (byOrg.get(client.organizationId) || 0) + 1);
        }
      }

      return {
        totalClients: clients.size,
        byOrganization: Object.fromEntries(byOrg),
      };
    }),

  // Disconnect a specific client
  disconnect: pub
    .route({
      method: "POST",
      path: "/realtime/disconnect",
      summary: "Disconnect a specific client",
      tags: ["Realtime"],
    })
    .input(z.object({ clientId: z.string() }))
    .handler(async ({ input }) => {
      const removed = clients.delete(input.clientId);
      return { success: removed };
    }),
};

// Export broadcast for use in other routers
export { broadcast };
