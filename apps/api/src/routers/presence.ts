/**
 * Presence Router
 *
 * Handles user presence and session tracking via heartbeat.
 */

import { z } from "zod";
import { pub } from "../procedures";
import {
  getActiveSessions,
  getActiveSessionCount,
  recordLogin,
  recordLogout,
  recordPageView,
  updateHeartbeat,
} from "../services/session-tracking";

export const presenceRouter = {
  // Heartbeat to update session presence
  heartbeat: pub
    .route({
      method: "POST",
      path: "/presence/heartbeat",
      summary: "Session heartbeat",
      tags: ["Presence"],
    })
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        message: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const success = updateHeartbeat(input.sessionId);
      return {
        success,
        message: success ? "Heartbeat updated" : "Session not found",
      };
    }),

  // Record a page view
  pageView: pub
    .route({
      method: "POST",
      path: "/presence/pageview",
      summary: "Record page view",
      tags: ["Presence"],
    })
    .input(
      z.object({
        sessionId: z.string(),
        path: z.string(),
        duration: z.number().optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .handler(async ({ input }) => {
      const pageView = recordPageView({
        sessionId: input.sessionId,
        path: input.path,
        duration: input.duration,
      });
      return {
        success: !!pageView,
      };
    }),

  // Record a login event
  login: pub
    .route({
      method: "POST",
      path: "/presence/login",
      summary: "Record user login",
      tags: ["Presence"],
    })
    .input(
      z.object({
        sessionId: z.string(),
        userId: z.string(),
        organizationId: z.string(),
        ip: z.string().optional(),
        userAgent: z.string().optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        sessionStartedAt: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const session = recordLogin({
        sessionId: input.sessionId,
        userId: input.userId,
        organizationId: input.organizationId,
        ip: input.ip,
        userAgent: input.userAgent,
      });
      return {
        success: true,
        sessionStartedAt: session.startedAt,
      };
    }),

  // Record a logout event
  logout: pub
    .route({
      method: "POST",
      path: "/presence/logout",
      summary: "Record user logout",
      tags: ["Presence"],
    })
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .handler(async ({ input }) => {
      const session = recordLogout(input.sessionId);
      return {
        success: !!session,
      };
    }),

  // Get active sessions for the current organization
  getActiveSessions: pub
    .route({
      method: "GET",
      path: "/presence/active-sessions",
      summary: "Get active sessions",
      tags: ["Presence"],
    })
    .output(
      z.object({
        sessions: z.array(
          z.object({
            id: z.string(),
            userId: z.string(),
            startedAt: z.string(),
            lastActiveAt: z.string(),
            pageViews: z.array(
              z.object({
                path: z.string(),
                timestamp: z.string(),
              }),
            ),
          }),
        ),
        count: z.number(),
      }),
    )
    .handler(async () => {
      const sessions = getActiveSessions();
      return {
        sessions: sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          startedAt: s.startedAt,
          lastActiveAt: s.lastActiveAt,
          pageViews: s.pageViews,
        })),
        count: sessions.length,
      };
    }),

  // Get active session count for an organization
  getSessionCount: pub
    .route({
      method: "GET",
      path: "/presence/session-count",
      summary: "Get active session count",
      tags: ["Presence"],
    })
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .output(
      z.object({
        count: z.number(),
      }),
    )
    .handler(async ({ input }) => {
      const count = getActiveSessionCount(input.organizationId);
      return { count };
    }),
};
