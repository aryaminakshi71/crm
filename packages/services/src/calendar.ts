/**
 * Calendar Service Abstraction
 *
 * Stub implementation that logs to console.
 * Replace with actual provider (Google Calendar, Outlook, etc.)
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  attendees?: string[];
  location?: string;
  meetingLink?: string;
}

export interface CalendarService {
  createEvent(
    event: CalendarEvent,
  ): Promise<{ success: boolean; eventId?: string }>;
  updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>,
  ): Promise<{ success: boolean }>;
  deleteEvent(eventId: string): Promise<{ success: boolean }>;
  getAvailability(
    startTime: string,
    endTime: string,
    attendees: string[],
  ): Promise<{
    available: boolean;
    slots?: { start: string; end: string }[];
  }>;
}

/**
 * Stub calendar service - logs to console
 * Replace with actual implementation for production
 */
export const calendarService: CalendarService = {
  async createEvent(event: CalendarEvent) {
    console.log("[Calendar Stub] Creating event:", {
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      attendees: event.attendees,
    });
    // In production, replace with actual calendar provider:
    // - Google Calendar: await calendar.events.insert({ ... })
    // - Outlook: await graphClient.api('/me/events').post({ ... })
    return { success: true, eventId: `stub-${Date.now()}` };
  },

  async updateEvent(eventId: string, event: Partial<CalendarEvent>) {
    console.log("[Calendar Stub] Updating event:", eventId, event);
    // In production, implement event update with your provider
    return { success: true };
  },

  async deleteEvent(eventId: string) {
    console.log("[Calendar Stub] Deleting event:", eventId);
    // In production, implement event deletion with your provider
    return { success: true };
  },

  async getAvailability(
    startTime: string,
    endTime: string,
    attendees: string[],
  ) {
    console.log("[Calendar Stub] Checking availability:", {
      start: startTime,
      end: endTime,
      attendees,
    });
    // In production, implement free/busy query with your provider
    return { available: true };
  },
};

/**
 * CRM-specific calendar helpers
 */
export const calendarHelpers = {
  /**
   * Schedule a meeting from an activity
   */
  scheduleMeetingFromActivity: async (activity: {
    subject: string;
    description?: string;
    dueDate: string;
    durationMinutes: number;
    contactEmail?: string;
    userEmail: string;
  }) => {
    const startTime = new Date(activity.dueDate);
    const endTime = new Date(
      startTime.getTime() + activity.durationMinutes * 60 * 1000,
    );

    const event: CalendarEvent = {
      title: activity.subject,
      description: activity.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees: [
        activity.userEmail,
        ...(activity.contactEmail ? [activity.contactEmail] : []),
      ],
    };

    return calendarService.createEvent(event);
  },

  /**
   * Reschedule a meeting
   */
  rescheduleMeeting: async (
    eventId: string,
    newDueDate: string,
    durationMinutes: number,
  ) => {
    const startTime = new Date(newDueDate);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    return calendarService.updateEvent(eventId, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  },

  /**
   * Cancel a meeting
   */
  cancelMeeting: async (eventId: string) => {
    return calendarService.deleteEvent(eventId);
  },
};
