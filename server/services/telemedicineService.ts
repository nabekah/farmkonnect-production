import axios from 'axios';
import jwt from 'jsonwebtoken';

export interface ZoomMeetingConfig {
  topic: string;
  type: number; // 1 = instant, 2 = scheduled
  start_time?: string; // ISO 8601 format
  duration: number; // in minutes
  timezone: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
    recording: 'local' | 'cloud' | 'none';
  };
}

export interface TelemedicineSession {
  sessionId: string;
  meetingLink: string;
  meetingId: string;
  password?: string;
  startTime: Date;
  endTime: Date;
  veterinarianName: string;
  farmerName: string;
  animalName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recordingUrl?: string;
}

/**
 * Generate Zoom JWT token
 */
function generateZoomJWT(): string {
  const payload = {
    iss: process.env.ZOOM_API_KEY,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };

  return jwt.sign(payload, process.env.ZOOM_API_SECRET!, {
    algorithm: 'HS256',
  });
}

/**
 * Create a Zoom meeting for telemedicine consultation
 */
export async function createZoomMeeting(
  config: ZoomMeetingConfig
): Promise<{ success: boolean; meeting?: any; error?: string }> {
  try {
    const token = generateZoomJWT();

    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      config,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      meeting: response.data,
    };
  } catch (error) {
    console.error('Failed to create Zoom meeting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Zoom meeting details
 */
export async function getZoomMeetingDetails(
  meetingId: string
): Promise<{ success: boolean; meeting?: any; error?: string }> {
  try {
    const token = generateZoomJWT();

    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      meeting: response.data,
    };
  } catch (error) {
    console.error('Failed to get Zoom meeting details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update Zoom meeting settings
 */
export async function updateZoomMeeting(
  meetingId: string,
  updates: Partial<ZoomMeetingConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = generateZoomJWT();

    await axios.patch(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to update Zoom meeting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(
  meetingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = generateZoomJWT();

    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to delete Zoom meeting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Zoom meeting recordings
 */
export async function getZoomMeetingRecordings(
  meetingId: string
): Promise<{ success: boolean; recordings?: any[]; error?: string }> {
  try {
    const token = generateZoomJWT();

    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      recordings: response.data.recording_files || [],
    };
  } catch (error) {
    console.error('Failed to get Zoom recordings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Schedule telemedicine consultation with Zoom
 */
export async function scheduleTelemedicineConsultation(
  veterinarianName: string,
  farmerName: string,
  farmerEmail: string,
  animalName: string,
  consultationType: string,
  startTime: Date,
  durationMinutes: number = 30,
  notes: string = ''
): Promise<TelemedicineSession | null> {
  try {
    const meetingConfig: ZoomMeetingConfig = {
      topic: `Telemedicine Consultation: ${animalName} - ${consultationType}`,
      type: 2, // Scheduled meeting
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone: 'Africa/Accra',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: true,
        recording: 'cloud',
      },
    };

    const result = await createZoomMeeting(meetingConfig);

    if (!result.success || !result.meeting) {
      throw new Error(result.error || 'Failed to create meeting');
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    return {
      sessionId: `session-${Date.now()}`,
      meetingLink: result.meeting.join_url,
      meetingId: result.meeting.id,
      password: result.meeting.password,
      startTime,
      endTime,
      veterinarianName,
      farmerName,
      animalName,
      status: 'scheduled',
    };
  } catch (error) {
    console.error('Failed to schedule telemedicine consultation:', error);
    return null;
  }
}

/**
 * Start telemedicine session
 */
export async function startTelemedicineSession(
  session: TelemedicineSession
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update session status
    session.status = 'in_progress';

    // In a real implementation, this would update the database
    console.log('Telemedicine session started:', {
      sessionId: session.sessionId,
      meetingId: session.meetingId,
      startTime: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to start telemedicine session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * End telemedicine session
 */
export async function endTelemedicineSession(
  session: TelemedicineSession
): Promise<{ success: boolean; recordingUrl?: string; error?: string }> {
  try {
    // Update session status
    session.status = 'completed';

    // Get recording if available
    const recordingResult = await getZoomMeetingRecordings(session.meetingId);

    let recordingUrl: string | undefined;
    if (recordingResult.success && recordingResult.recordings && recordingResult.recordings.length > 0) {
      recordingUrl = recordingResult.recordings[0].download_url;
      session.recordingUrl = recordingUrl;
    }

    console.log('Telemedicine session ended:', {
      sessionId: session.sessionId,
      meetingId: session.meetingId,
      endTime: new Date(),
      recordingUrl,
    });

    return {
      success: true,
      recordingUrl,
    };
  } catch (error) {
    console.error('Failed to end telemedicine session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel telemedicine session
 */
export async function cancelTelemedicineSession(
  session: TelemedicineSession
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete Zoom meeting
    const deleteResult = await deleteZoomMeeting(session.meetingId);

    if (!deleteResult.success) {
      throw new Error(deleteResult.error);
    }

    // Update session status
    session.status = 'cancelled';

    console.log('Telemedicine session cancelled:', {
      sessionId: session.sessionId,
      meetingId: session.meetingId,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to cancel telemedicine session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate participant join link with pre-filled name
 */
export function generateParticipantJoinLink(
  meetingLink: string,
  participantName: string
): string {
  const encodedName = encodeURIComponent(participantName);
  return `${meetingLink}?name=${encodedName}`;
}

/**
 * Create instant Zoom meeting for emergency consultation
 */
export async function createInstantTelemedicineSession(
  veterinarianName: string,
  farmerName: string,
  animalName: string,
  consultationType: string
): Promise<TelemedicineSession | null> {
  try {
    const meetingConfig: ZoomMeetingConfig = {
      topic: `Emergency Consultation: ${animalName} - ${consultationType}`,
      type: 1, // Instant meeting
      duration: 60,
      timezone: 'Africa/Accra',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: false,
        waiting_room: false,
        recording: 'cloud',
      },
    };

    const result = await createZoomMeeting(meetingConfig);

    if (!result.success || !result.meeting) {
      throw new Error(result.error || 'Failed to create meeting');
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    return {
      sessionId: `session-${Date.now()}`,
      meetingLink: result.meeting.join_url,
      meetingId: result.meeting.id,
      password: result.meeting.password,
      startTime,
      endTime,
      veterinarianName,
      farmerName,
      animalName,
      status: 'in_progress',
    };
  } catch (error) {
    console.error('Failed to create instant telemedicine session:', error);
    return null;
  }
}
