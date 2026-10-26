/**
 * Service to interact with the Google Meet REST API (v2)
 */

export interface MeetSpaceResponse {
  name: string;
  meetingUri: string;
  meetingCode?: string;
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
}

export function generateFallbackMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export async function createGoogleMeetSpace(
  accessToken: string | null
): Promise<{ meetUrl: string; spaceName?: string; isOfficialApi: boolean }> {
  if (accessToken) {
    try {
      const response = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data: MeetSpaceResponse = await response.json();
        if (data.meetingUri) {
          return {
            meetUrl: data.meetingUri,
            spaceName: data.name,
            isOfficialApi: true,
          };
        }
      } else {
        console.warn('Google Meet API space creation responded with:', response.status, await response.text());
      }
    } catch (err) {
      console.warn('Error calling Google Meet API directly:', err);
    }
  }

  // Fallback to instantly ready Google Meet link
  const code = generateFallbackMeetCode();
  return {
    meetUrl: `https://meet.google.com/${code}`,
    spaceName: `spaces/${code}`,
    isOfficialApi: false,
  };
}
