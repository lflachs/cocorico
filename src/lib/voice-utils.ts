/**
 * Voice Assistant Utilities
 * Helper functions for text-to-speech and voice processing
 */

/**
 * Convert unit abbreviations to spoken form
 */
export function getSpokenUnit(unit: string, quantity: number, language: 'fr' | 'en' = 'fr'): string {
  const isFrench = language === 'fr';
  const isPlural = quantity > 1;

  switch (unit) {
    case 'KG':
      return isFrench
        ? (isPlural ? 'kilogrammes' : 'kilogramme')
        : (isPlural ? 'kilograms' : 'kilogram');
    case 'L':
      return isFrench
        ? (isPlural ? 'litres' : 'litre')
        : (isPlural ? 'liters' : 'liter');
    case 'PC':
      return isFrench
        ? (isPlural ? 'pièces' : 'pièce')
        : (isPlural ? 'pieces' : 'piece');
    default:
      return unit;
  }
}

/**
 * Convert price to spoken form
 */
export function getSpokenPrice(price: number, isFrench: boolean): string {
  // If less than 1 euro, speak in cents
  if (price < 1) {
    const cents = Math.round(price * 100);
    if (isFrench) {
      return cents === 1 ? "1 centime" : `${cents} centimes`;
    } else {
      return cents === 1 ? "1 cent" : `${cents} cents`;
    }
  }

  // If exactly a whole number of euros
  const euros = Math.floor(price);
  const cents = Math.round((price - euros) * 100);

  if (cents === 0) {
    if (isFrench) {
      return euros === 1 ? "1 euro" : `${euros} euros`;
    } else {
      return euros === 1 ? "1 euro" : `${euros} euros`;
    }
  }

  // If has both euros and cents
  if (isFrench) {
    const euroText = euros === 1 ? "1 euro" : `${euros} euros`;
    const centText = cents === 1 ? "1 centime" : `${cents} centimes`;
    return `${euroText} ${centText}`;
  } else {
    const euroText = euros === 1 ? "1 euro" : `${euros} euros`;
    const centText = cents === 1 ? "1 cent" : `${cents} cents`;
    return `${euroText} ${centText}`;
  }
}

/**
 * Get current language from cookie or localStorage
 */
export function getCurrentLanguage(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr';

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const lang = getCookie('language') || localStorage.getItem('language') || 'fr';
  return lang as 'fr' | 'en';
}

/**
 * Play notification sound with error handling
 */
export function playNotificationSound(): void {
  // Check if sound is enabled
  const soundEnabled = localStorage.getItem('soundEnabled');
  if (soundEnabled === 'false') {
    console.log("[Voice] Sound is disabled, skipping notification");
    return;
  }

  try {
    const audio = new Audio('/sounds/cocorico-notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.error("[Voice] Error playing notification sound:", error);
      // Silently fail - notification sound is not critical
    });
    console.log("[Voice] Notification sound played");
  } catch (error) {
    console.error("[Voice] Error playing notification sound:", error);
    // Silently fail - notification sound is not critical
  }
}

/**
 * Get best supported audio MIME type for recording
 */
export function getBestAudioMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      console.log('[Voice] Using MIME type:', mimeType);
      return mimeType;
    }
  }

  return ''; // Use default
}

/**
 * Haptic feedback vibration patterns
 */
export const VibrationPatterns = {
  /** Light tap - 10ms vibration */
  light: 10,
  /** Medium tap - 20ms vibration */
  medium: 20,
  /** Strong tap - 50ms vibration */
  strong: 50,
  /** Success pattern - short double buzz */
  success: [30, 50, 30],
  /** Error pattern - longer single buzz */
  error: [100],
  /** Start listening - quick double tap */
  startListening: [20, 30, 20],
  /** Stop listening - single medium tap */
  stopListening: [30],
} as const;

/**
 * Trigger haptic feedback vibration
 * @param pattern - Vibration pattern (number or array)
 */
export function vibrate(pattern: number | number[]): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  // Check if vibration is supported
  if (!navigator.vibrate) {
    console.log('[Vibration] API not supported');
    return;
  }

  // Check if user has enabled vibrations (optional - you can add this setting later)
  const vibrationsEnabled = localStorage.getItem('vibrationsEnabled');
  if (vibrationsEnabled === 'false') {
    console.log('[Vibration] Disabled by user');
    return;
  }

  try {
    // iOS requires vibrations to happen synchronously within user gesture
    // Use requestAnimationFrame for better timing on iOS
    requestAnimationFrame(() => {
      try {
        const success = navigator.vibrate(pattern);
        if (success) {
          console.log('[Vibration] Triggered:', pattern);
        } else {
          console.log('[Vibration] Failed - possibly blocked by browser');
        }
      } catch (innerError) {
        console.error('[Vibration] Inner error:', innerError);
      }
    });
  } catch (error) {
    console.error('[Vibration] Error:', error);
    // Silently fail - vibration is not critical
  }
}
