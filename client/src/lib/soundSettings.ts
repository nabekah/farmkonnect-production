/**
 * Notification Sound Settings
 * Manages sound preferences for different notification types
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
  sounds: Record<NotificationType, {
    enabled: boolean;
    soundUrl: string;
  }>;
}

// Default sound URLs (using data URIs for simple beep sounds)
const DEFAULT_SOUNDS = {
  success: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGe77OmfTRAMUKXi8LdjHAY4kdfy0HotBSR3x/DdkEAKFF604+yoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba8sZzKQUrgM7y2Yk2CBhnu+zpn00QDFA=',
  error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGe77OmfTRAMUKXi8LdjHAY4kdfy0HotBSR3x/DdkEAKFF604+yoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba8sZzKQUrgM7y2Yk2CBhnu+zpn00QDFA=',
  warning: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGe77OmfTRAMUKXi8LdjHAY4kdfy0HotBSR3x/DdkEAKFF604+yoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba8sZzKQUrgM7y2Yk2CBhnu+zpn00QDFA=',
  info: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSuAzvLZiTYIGGe77OmfTRAMUKXi8LdjHAY4kdfy0HotBSR3x/DdkEAKFF604+yoVRQKRp/g8r5sIQUxh9Hz04IzBh5uwO/jmVENEFas5++wXRgIPpba8sZzKQUrgM7y2Yk2CBhnu+zpn00QDFA=',
};

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.5,
  sounds: {
    success: { enabled: true, soundUrl: DEFAULT_SOUNDS.success },
    error: { enabled: true, soundUrl: DEFAULT_SOUNDS.error },
    warning: { enabled: true, soundUrl: DEFAULT_SOUNDS.warning },
    info: { enabled: false, soundUrl: DEFAULT_SOUNDS.info },
  },
};

/**
 * Play a notification sound
 */
export async function playNotificationSound(
  type: NotificationType,
  settings: SoundSettings
): Promise<void> {
  if (!settings.enabled) return;

  const typeSettings = settings.sounds[type];
  if (!typeSettings || !typeSettings.enabled) return;

  try {
    const audio = new Audio(typeSettings.soundUrl);
    audio.volume = Math.max(0, Math.min(1, settings.volume));
    await audio.play().catch(() => {
      // Silently fail if audio playback is not allowed
    });
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };
  return labels[type];
}
