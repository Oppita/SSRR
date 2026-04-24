/**
 * Security Utility for Military-Grade Encryption (AES-GCM 256-bit)
 * Uses the native Web Crypto API for high-performance, secure encryption.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Derives a cryptographic key from a string (e.g., user ID + secret)
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-GCM 256
 */
export async function encryptData(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(data)
  );

  // Combine salt, iv, and encrypted content into a single base64 string
  const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);

  // Safe base64 encoding for large arrays (prevents RangeError: Maximum call stack size exceeded)
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64 string using AES-GCM 256
 */
export async function decryptData(encryptedBase64: string, secret: string): Promise<string> {
  const decoder = new TextDecoder();
  
  // Safe base64 decoding for large strings
  const binaryString = atob(encryptedBase64);
  const len = binaryString.length;
  const combined = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedContent = combined.slice(28);

  const key = await deriveKey(secret, salt);

  try {
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedContent
    );
    return decoder.decode(decryptedContent);
  } catch (error) {
    throw new Error('Fallo en la desencriptación. La clave de seguridad podría ser incorrecta.');
  }
}
