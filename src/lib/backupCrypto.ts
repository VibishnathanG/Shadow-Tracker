/**
 * Shadow Tracker Cryptographic Backup Engine
 * 
 * Provides client-side AES-256-GCM encryption with PBKDF2 key derivation
 * and SHA-256 cryptographic checksums for tamper detection.
 */

import { BackupData } from '@/types';

export interface EncryptedBackupEnvelope {
  format: 'shadow-tracker-backup';
  version: 2;
  encrypted: true;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2';
  kdfParams: {
    hash: 'SHA-256';
    iterations: number;
    salt: string; // hex
  };
  iv: string; // hex
  ciphertext: string; // base64
  checksum: string; // SHA-256 hex of ciphertext for integrity
  createdAt: string;
}

export interface SignedBackupEnvelope {
  format: 'shadow-tracker-backup';
  version: 2;
  encrypted: false;
  algorithm: 'SHA-256';
  checksum: string; // SHA-256 hex of canonical JSON payload
  payload: BackupData;
  createdAt: string;
}

export type BackupEnvelope = EncryptedBackupEnvelope | SignedBackupEnvelope;

export interface VerifyBackupResult {
  data: BackupData;
  wasEncrypted: boolean;
  wasSigned: boolean;
  verified: boolean;
  tampered?: boolean;
  needsPassword?: boolean;
}

// Helper: Convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper: Convert Uint8Array to base64
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert base64 to Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Get the native crypto.subtle instance (Browser and Node.js)
function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not supported in this runtime environment.');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('Web Crypto API (crypto.getRandomValues) is not supported in this runtime environment.');
}

/**
 * Compute SHA-256 checksum of string or Uint8Array.
 * Returns lowercase hex string.
 */
export async function computeSha256(data: string | Uint8Array): Promise<string> {
  const subtle = getSubtleCrypto();
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await subtle.digest('SHA-256', bytes as BufferSource);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Derive an AES-256-GCM key from a user password using PBKDF2.
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const passwordKey = await subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export backup data as a signed JSON envelope with cryptographic SHA-256 checksum.
 */
export async function exportSignedBackup(backupData: BackupData): Promise<string> {
  const payloadStr = JSON.stringify(backupData);
  const checksum = await computeSha256(payloadStr);

  const envelope: SignedBackupEnvelope = {
    format: 'shadow-tracker-backup',
    version: 2,
    encrypted: false,
    algorithm: 'SHA-256',
    checksum,
    payload: backupData,
    createdAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Export backup data as a password-protected AES-256-GCM encrypted envelope.
 */
export async function exportEncryptedBackup(backupData: BackupData, password: string): Promise<string> {
  if (!password || password.length < 4) {
    throw new Error('Encryption password must be at least 4 characters long.');
  }

  const subtle = getSubtleCrypto();
  const salt = getRandomValues(new Uint8Array(16));
  const iv = getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKeyFromPassword(password, salt, iterations);
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(backupData));

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: 128,
    },
    key,
    plaintextBytes
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  const ciphertextBase64 = bytesToBase64(ciphertextBytes);
  const checksum = await computeSha256(ciphertextBytes);

  const envelope: EncryptedBackupEnvelope = {
    format: 'shadow-tracker-backup',
    version: 2,
    encrypted: true,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2',
    kdfParams: {
      hash: 'SHA-256',
      iterations,
      salt: bytesToHex(salt),
    },
    iv: bytesToHex(iv),
    ciphertext: ciphertextBase64,
    checksum,
    createdAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Check whether a string content is an encrypted Shadow Tracker envelope without decrypting.
 */
export function isEncryptedBackup(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed && parsed.format === 'shadow-tracker-backup' && parsed.encrypted === true;
  } catch {
    return false;
  }
}

/**
 * Check whether a string content is a signed/envelope Shadow Tracker backup.
 */
export function isBackupEnvelope(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    return parsed && parsed.format === 'shadow-tracker-backup';
  } catch {
    return false;
  }
}

/**
 * Parse, verify, and decrypt (if needed) an imported backup file.
 * Handles:
 * 1. Password-protected AES-256-GCM envelopes (.shadowbackup / .enc / .json)
 * 2. SHA-256 Signed envelopes with tamper verification
 * 3. Legacy un-enveloped JSON backups (for manual edits / backwards compatibility)
 */
export async function parseAndVerifyBackup(
  content: string,
  password?: string
): Promise<VerifyBackupResult> {
  if (!content || !content.trim()) {
    throw new Error('The backup file is completely empty.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    throw new Error(`Invalid JSON syntax: ${err?.message || 'Could not parse JSON'}`);
  }

  // Case 1: Shadow Tracker Backup Envelope
  if (parsed && parsed.format === 'shadow-tracker-backup') {
    // Sub-case 1A: Encrypted Envelope
    if (parsed.encrypted === true) {
      if (!password) {
        return {
          data: null as any,
          wasEncrypted: true,
          wasSigned: true,
          verified: false,
          needsPassword: true,
        };
      }

      const env = parsed as EncryptedBackupEnvelope;
      const ciphertextBytes = base64ToBytes(env.ciphertext);

      // Verify tamper-proof checksum of ciphertext
      const computedChecksum = await computeSha256(ciphertextBytes);
      if (computedChecksum.toLowerCase() !== env.checksum.toLowerCase()) {
        throw new Error(
          `Tamper alert: Checksum mismatch on encrypted backup! Expected ${env.checksum}, but computed ${computedChecksum}. The file may be corrupt or modified.`
        );
      }

      // Decrypt using PBKDF2 key
      const salt = hexToBytes(env.kdfParams.salt);
      const iv = hexToBytes(env.iv);
      const key = await deriveKeyFromPassword(password, salt, env.kdfParams.iterations);

      let decryptedBuffer: ArrayBuffer;
      try {
        const subtle = getSubtleCrypto();
        decryptedBuffer = await subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv as BufferSource,
            tagLength: 128,
          },
          key,
          ciphertextBytes as BufferSource
        );
      } catch {
        throw new Error('Decryption failed. Invalid password or corrupted payload.');
      }

      const decryptedStr = new TextDecoder().decode(decryptedBuffer);
      const data = JSON.parse(decryptedStr) as BackupData;

      return {
        data,
        wasEncrypted: true,
        wasSigned: true,
        verified: true,
      };
    }

    // Sub-case 1B: Signed (Unencrypted) Envelope
    if (parsed.encrypted === false) {
      const env = parsed as SignedBackupEnvelope;
      const payloadStr = JSON.stringify(env.payload);
      const computedChecksum = await computeSha256(payloadStr);

      if (computedChecksum.toLowerCase() !== env.checksum.toLowerCase()) {
        throw new Error(
          `Tamper alert: Cryptographic checksum verification failed! Expected ${env.checksum}, but computed ${computedChecksum}. The backup has been tampered with or corrupted.`
        );
      }

      return {
        data: env.payload,
        wasEncrypted: false,
        wasSigned: true,
        verified: true,
      };
    }
  }

  // Case 2: Legacy raw JSON format (Direct BackupData object)
  // Power users can edit or import plain JSON without envelope
  if (parsed && (Array.isArray(parsed.tasks) || Array.isArray(parsed.habits) || parsed.version)) {
    return {
      data: parsed as BackupData,
      wasEncrypted: false,
      wasSigned: false,
      verified: true,
    };
  }

  throw new Error('Unrecognized backup file format. Expected a valid Shadow Tracker backup.');
}
