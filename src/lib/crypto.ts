import { AppConfig } from '../types';

export const ENCRYPTED_CONFIG_KEY = 't9orat_config_encrypted';
export const LEGACY_CONFIG_KEY = 'symphony_config';

/**
 * Checks if Web Crypto API is available in the current runtime environment
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.getRandomValues === 'function'
  );
}

/**
 * Safe wrapper around localStorage.setItem with QuotaExceededError handling
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[SafeStorage] Failed to set item for key "${key}":`, error);
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014 ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.error(
        '[SafeStorage] QuotaExceededError: مساحة التخزين المحلي ممتلئة. يرجى مسح الجلسات القديمة.'
      );
    }
    return false;
  }
}

/**
 * Safe wrapper around localStorage.getItem
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Failed to read item for key "${key}":`, error);
    return null;
  }
}

/**
 * Encodes text to UTF-8 bytes then applies XOR mask with a salt
 */
function maskWithSalt(text: string, salt: Uint8Array): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const masked = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    masked[i] = bytes[i] ^ salt[i % salt.length];
  }

  // Convert to binary string for btoa
  let binary = '';
  for (let i = 0; i < masked.length; i++) {
    binary += String.fromCharCode(masked[i]);
  }
  return btoa(binary);
}

/**
 * Reverses XOR mask with salt back to original UTF-8 string
 */
function unmaskWithSalt(base64Payload: string, salt: Uint8Array): string {
  const binary = atob(base64Payload);
  const masked = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    masked[i] = binary.charCodeAt(i);
  }

  const bytes = new Uint8Array(masked.length);
  for (let i = 0; i < masked.length; i++) {
    bytes[i] = masked[i] ^ salt[i % salt.length];
  }

  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * Validates that an object conforms to the AppConfig structure
 */
function isValidConfig(obj: unknown): obj is AppConfig {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.provider === 'string' &&
    ['gemini', 'openai', 'groq', 'custom'].includes(c.provider) &&
    typeof c.apiKey === 'string' &&
    typeof c.model === 'string'
  );
}

/**
 * Saves the AppConfig in an encrypted/obfuscated format to localStorage
 * Uses Web Crypto getRandomValues when available, falling back to base64 obfuscation.
 */
export function saveEncryptedConfig(config: AppConfig): boolean {
  try {
    const rawJson = JSON.stringify(config);

    let storedValue: string;

    if (isWebCryptoAvailable()) {
      // High-entropy 16-byte random salt via Web Crypto
      const salt = new Uint8Array(16);
      window.crypto.getRandomValues(salt);
      const saltHex = Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const masked = maskWithSalt(rawJson, salt);
      storedValue = `v1:${saltHex}:${masked}`;
    } else {
      // Fallback to base64 obfuscation
      const encoded = btoa(encodeURIComponent(rawJson));
      storedValue = `v0:${encoded}`;
    }

    const saved = safeLocalStorageSet(ENCRYPTED_CONFIG_KEY, storedValue);

    // If successfully saved in secure storage, remove the legacy plain-text key
    if (saved) {
      try {
        localStorage.removeItem(LEGACY_CONFIG_KEY);
      } catch {
        // Ignore removal errors
      }
    }

    return saved;
  } catch (error) {
    console.error('[SafeStorage] Error saving encrypted config:', error);
    return false;
  }
}

/**
 * Loads and decrypts/deobfuscates the AppConfig from localStorage.
 * Backward-compatible with legacy plain-text configs and migrates them automatically.
 */
export function loadEncryptedConfig(): AppConfig | null {
  try {
    // 1. Try modern encrypted key first
    const encryptedRaw = safeLocalStorageGet(ENCRYPTED_CONFIG_KEY);
    if (encryptedRaw) {
      if (encryptedRaw.startsWith('v1:')) {
        const parts = encryptedRaw.split(':');
        if (parts.length === 3) {
          const saltHex = parts[1];
          const payload = parts[2];
          const saltBytes = new Uint8Array(
            saltHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
          );
          const decryptedJson = unmaskWithSalt(payload, saltBytes);
          const parsed = JSON.parse(decryptedJson);
          if (isValidConfig(parsed)) return parsed;
        }
      } else if (encryptedRaw.startsWith('v0:')) {
        const payload = encryptedRaw.slice(3);
        const decodedJson = decodeURIComponent(atob(payload));
        const parsed = JSON.parse(decodedJson);
        if (isValidConfig(parsed)) return parsed;
      }
    }

    // 2. Fallback to legacy plain-text key for backward compatibility
    const legacyRaw = safeLocalStorageGet(LEGACY_CONFIG_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.provider) parsed.provider = 'gemini';
        if (isValidConfig(parsed)) {
          // Transparently upgrade legacy plain-text config to encrypted storage
          saveEncryptedConfig(parsed);
          return parsed;
        }
      }
    }

    return null;
  } catch (error) {
    console.warn('[SafeStorage] Failed to load or decrypt config:', error);
    return null;
  }
}

/**
 * Clears stored configuration from both encrypted and legacy storage keys
 */
export function clearStoredConfig(): void {
  try {
    localStorage.removeItem(ENCRYPTED_CONFIG_KEY);
    localStorage.removeItem(LEGACY_CONFIG_KEY);
  } catch (error) {
    console.warn('[SafeStorage] Failed to clear stored config:', error);
  }
}
