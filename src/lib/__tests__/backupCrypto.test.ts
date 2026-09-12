import { describe, it, expect } from 'vitest';
import {
  computeSha256,
  exportSignedBackup,
  exportEncryptedBackup,
  parseAndVerifyBackup,
  isEncryptedBackup,
  isBackupEnvelope,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
} from '../backupCrypto';
import { BackupData } from '@/types';

const mockBackupData: BackupData = {
  version: '2.0.0',
  exportedAt: '2026-09-12T10:00:00.000Z',
  tasks: [
    {
      id: 'task-1',
      title: 'Infiltrate the Shadow Core',
      description: 'Covert reconnaissance mission',
      category: 'work',
      priority: 'high',
      energyLevel: 'high',
      dueDate: '2026-09-15',
      dueTime: '18:00',
      estimatedDuration: 45,
      completed: false,
      tags: ['stealth', 'ops'],
      status: 'pending',
      subtasks: [],
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
      order: 1,
    } as any,
  ],
  habits: [
    {
      id: 'habit-1',
      name: 'Cold Shower Discipline',
      description: 'Physical hardening ritual',
      category: 'health',
      frequency: 'daily',
      targetDays: [1, 2, 3, 4, 5, 6, 7],
      currentStreak: 14,
      longestStreak: 30,
      createdAt: '2026-09-01T00:00:00.000Z',
      archived: false,
    } as any,
  ],
  dailyLogs: [],
  notes: [],
  reminders: [],
  categories: [
    { id: 'work', name: 'Work', color: '#8B5CF6', icon: 'briefcase' } as any,
  ],
  standaloneTodos: [
    {
      id: 'todo-1',
      text: 'Synchronize quantum cipher',
      completed: false,
      priority: 'high',
      createdAt: '2026-09-12T08:00:00.000Z',
    } as any,
  ],
  settings: {
    theme: 'obsidian',
    operatorAlias: 'Shadow Alone',
  } as any,
};

describe('backupCrypto: Utility Conversions', () => {
  it('converts between bytes and hex accurately', () => {
    const original = new Uint8Array([0, 15, 16, 255, 128, 42]);
    const hex = bytesToHex(original);
    expect(hex).toBe('000f10ff802a');
    const roundtrip = hexToBytes(hex);
    expect(roundtrip).toEqual(original);
  });

  it('converts between bytes and base64 accurately', () => {
    const text = 'Shadow-Tracker-Protocol-2026';
    const bytes = new TextEncoder().encode(text);
    const base64 = bytesToBase64(bytes);
    const roundtrip = base64ToBytes(base64);
    expect(new TextDecoder().decode(roundtrip)).toBe(text);
  });
});

describe('backupCrypto: SHA-256 Checksum Engine', () => {
  it('computes 64-character lowercase hexadecimal hash', async () => {
    const hash = await computeSha256('hello world');
    expect(hash).toHaveLength(64);
    // Known SHA-256 for 'hello world'
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('computes deterministic hashes for string and Uint8Array inputs', async () => {
    const message = 'Autonomous Tactical Agent Data';
    const hash1 = await computeSha256(message);
    const hash2 = await computeSha256(new TextEncoder().encode(message));
    expect(hash1).toBe(hash2);
  });
});

describe('backupCrypto: Signed Envelope (Tamper Prevention)', () => {
  it('exports a valid signed envelope with verifiable checksum', async () => {
    const signedJson = await exportSignedBackup(mockBackupData);
    expect(isBackupEnvelope(signedJson)).toBe(true);
    expect(isEncryptedBackup(signedJson)).toBe(false);

    const parsed = JSON.parse(signedJson);
    expect(parsed.format).toBe('shadow-tracker-backup');
    expect(parsed.version).toBe(2);
    expect(parsed.encrypted).toBe(false);
    expect(parsed.algorithm).toBe('SHA-256');
    expect(parsed.checksum).toHaveLength(64);
    expect(parsed.payload.tasks).toHaveLength(1);

    const result = await parseAndVerifyBackup(signedJson);
    expect(result.verified).toBe(true);
    expect(result.wasSigned).toBe(true);
    expect(result.wasEncrypted).toBe(false);
    expect(result.data.tasks[0].title).toBe('Infiltrate the Shadow Core');
  });

  it('detects tampering and rejects modified payload', async () => {
    const signedJson = await exportSignedBackup(mockBackupData);
    const envelope = JSON.parse(signedJson);

    // Tamper with data without updating checksum
    envelope.payload.tasks[0].title = 'Tampered Title Infiltration';
    const tamperedJson = JSON.stringify(envelope);

    await expect(parseAndVerifyBackup(tamperedJson)).rejects.toThrow(/Tamper alert: Cryptographic checksum verification failed/i);
  });
});

describe('backupCrypto: AES-256-GCM Password Encryption', () => {
  const testPassword = 'TacticalMasterPassword#2026!';

  it('fails if password is too short', async () => {
    await expect(exportEncryptedBackup(mockBackupData, 'abc')).rejects.toThrow(/at least 4 characters/i);
  });

  it('exports an encrypted envelope adhering to cryptographic specifications', async () => {
    const encryptedJson = await exportEncryptedBackup(mockBackupData, testPassword);
    expect(isBackupEnvelope(encryptedJson)).toBe(true);
    expect(isEncryptedBackup(encryptedJson)).toBe(true);

    const envelope = JSON.parse(encryptedJson);
    expect(envelope.format).toBe('shadow-tracker-backup');
    expect(envelope.version).toBe(2);
    expect(envelope.encrypted).toBe(true);
    expect(envelope.algorithm).toBe('AES-256-GCM');
    expect(envelope.kdf).toBe('PBKDF2');
    expect(envelope.kdfParams.hash).toBe('SHA-256');
    expect(envelope.kdfParams.iterations).toBe(100000);
    expect(envelope.kdfParams.salt).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(envelope.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.checksum).toHaveLength(64);

    // Payload text should not appear anywhere in raw ciphertext
    expect(encryptedJson).not.toContain('Infiltrate the Shadow Core');
    expect(encryptedJson).not.toContain('Cold Shower Discipline');
  });

  it('notifies caller when password is required upon inspection', async () => {
    const encryptedJson = await exportEncryptedBackup(mockBackupData, testPassword);
    const result = await parseAndVerifyBackup(encryptedJson); // no password provided
    expect(result.needsPassword).toBe(true);
    expect(result.wasEncrypted).toBe(true);
    expect(result.verified).toBe(false);
  });

  it('successfully decrypts when provided the correct password', async () => {
    const encryptedJson = await exportEncryptedBackup(mockBackupData, testPassword);
    const result = await parseAndVerifyBackup(encryptedJson, testPassword);
    expect(result.verified).toBe(true);
    expect(result.wasEncrypted).toBe(true);
    expect(result.data.tasks[0].title).toBe('Infiltrate the Shadow Core');
    expect(result.data.habits[0].name).toBe('Cold Shower Discipline');
    expect(result.data.standaloneTodos?.[0].text).toBe('Synchronize quantum cipher');
  });

  it('rejects decryption when provided an incorrect password', async () => {
    const encryptedJson = await exportEncryptedBackup(mockBackupData, testPassword);
    await expect(parseAndVerifyBackup(encryptedJson, 'WrongPassword123')).rejects.toThrow(/Decryption failed/i);
  });

  it('detects tampering with ciphertext before decryption', async () => {
    const encryptedJson = await exportEncryptedBackup(mockBackupData, testPassword);
    const envelope = JSON.parse(encryptedJson);

    // Flip bits/characters in ciphertext
    const originalCipher = envelope.ciphertext;
    envelope.ciphertext = originalCipher.substring(0, originalCipher.length - 4) + 'AAAA';
    const tamperedJson = JSON.stringify(envelope);

    await expect(parseAndVerifyBackup(tamperedJson, testPassword)).rejects.toThrow(/Tamper alert: Checksum mismatch/i);
  });
});

describe('backupCrypto: Legacy & Manual Editing Support', () => {
  it('seamlessly parses un-enveloped legacy BackupData (allowing manual editing)', async () => {
    const rawJson = JSON.stringify(mockBackupData, null, 2);
    expect(isBackupEnvelope(rawJson)).toBe(false);
    expect(isEncryptedBackup(rawJson)).toBe(false);

    const result = await parseAndVerifyBackup(rawJson);
    expect(result.verified).toBe(true);
    expect(result.wasEncrypted).toBe(false);
    expect(result.wasSigned).toBe(false);
    expect(result.data.tasks[0].title).toBe('Infiltrate the Shadow Core');
  });

  it('throws helpful error on empty string', async () => {
    await expect(parseAndVerifyBackup('')).rejects.toThrow(/completely empty/i);
    await expect(parseAndVerifyBackup('   ')).rejects.toThrow(/completely empty/i);
  });

  it('throws helpful error on invalid JSON', async () => {
    await expect(parseAndVerifyBackup('{ not valid json')).rejects.toThrow(/Invalid JSON syntax/i);
  });

  it('throws helpful error on unrecognized JSON structure', async () => {
    await expect(parseAndVerifyBackup('{"someRandom": 123}')).rejects.toThrow(/Unrecognized backup file format/i);
  });
});
