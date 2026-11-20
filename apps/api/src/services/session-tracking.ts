/**
 * Session Tracking Service
 *
 * Tracks user logins/logouts, page views, and session duration.
 */

interface Session {
  id: string;
  userId: string;
  organizationId: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  pageViews: PageView[];
  ip?: string;
  userAgent?: string;
}

interface PageView {
  path: string;
  timestamp: string;
  duration?: number;
}

// In-memory session storage
const sessions: Map<string, Session> = new Map();

// Active sessions (not ended)
const activeSessions: Map<string, Session> = new Map();

/**
 * Record a user login event
 */
export function recordLogin(params: {
  sessionId: string;
  userId: string;
  organizationId: string;
  ip?: string;
  userAgent?: string;
}): Session {
  const session: Session = {
    id: params.sessionId,
    userId: params.userId,
    organizationId: params.organizationId,
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ip: params.ip,
    userAgent: params.userAgent,
    pageViews: [],
  };

  sessions.set(session.id, session);
  activeSessions.set(session.id, session);

  return session;
}

/**
 * Record a user logout event
 */
export function recordLogout(sessionId: string): Session | null {
  const session = activeSessions.get(sessionId);
  if (!session) return null;

  session.endedAt = new Date().toISOString();
  session.lastActiveAt = session.endedAt;
  activeSessions.delete(sessionId);

  return session;
}

/**
 * Record a page view
 */
export function recordPageView(params: {
  sessionId: string;
  path: string;
  duration?: number;
}): PageView | null {
  const session = sessions.get(params.sessionId);
  if (!session) return null;

  const pageView: PageView = {
    path: params.path,
    timestamp: new Date().toISOString(),
    duration: params.duration,
  };

  session.pageViews.push(pageView);
  session.lastActiveAt = new Date().toISOString();

  return pageView;
}

/**
 * Update session heartbeat (presence)
 */
export function updateHeartbeat(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  session.lastActiveAt = new Date().toISOString();
  return true;
}

/**
 * Get active sessions
 */
export function getActiveSessions(): Session[] {
  return Array.from(activeSessions.values());
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

/**
 * Get sessions for a user
 */
export function getSessionsForUser(userId: string): Session[] {
  return Array.from(sessions.values()).filter((s) => s.userId === userId);
}

/**
 * Get active session count for an organization
 */
export function getActiveSessionCount(organizationId: string): number {
  return Array.from(activeSessions.values()).filter(
    (s) => s.organizationId === organizationId,
  ).length;
}

/**
 * Clean up stale sessions (inactive for more than 30 minutes)
 */
export function cleanupStaleSessions(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [id, session] of activeSessions) {
    const lastActive = new Date(session.lastActiveAt);
    const inactiveMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;

    if (inactiveMinutes > 30) {
      session.endedAt = now.toISOString();
      activeSessions.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
