/**
 * Google Calendar API Service
 */

export interface CalendarEventPayload {
  title: string;
  description: string;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  meetUrl: string;
}

export interface GoogleCalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
}

export async function createGoogleCalendarEvent(
  accessToken: string | null,
  event: CalendarEventPayload
): Promise<{ eventId?: string; htmlLink?: string; error?: string }> {
  if (!accessToken) {
    return { error: 'No se cuenta con autorización para Google Calendar' };
  }

  try {
    const startDate = new Date(event.scheduledAt);
    const endDate = new Date(startDate.getTime() + event.durationMinutes * 60 * 1000);

    const body = {
      summary: `🎓 [Clase Virtual] ${event.title}`,
      description: `${event.description}\n\nEnlace de Google Meet: ${event.meetUrl}\n\nOrganizado con MeetEdu.`,
      location: event.meetUrl,
      start: {
        dateTime: startDate.toISOString(),
      },
      end: {
        dateTime: endDate.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Calendar API error response:', errText);
      return { error: `Error de Google Calendar (${response.status})` };
    }

    const data: GoogleCalendarEventResponse = await response.json();
    return {
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return { error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Delete a Google Calendar event.
 * NOTE: Destructive operation - user confirmation must precede this call!
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string | null,
  eventId: string
): Promise<boolean> {
  if (!accessToken || !eventId) return false;

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404;
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    return false;
  }
}
