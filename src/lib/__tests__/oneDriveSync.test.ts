import { describe, it, expect, vi, beforeEach } from 'vitest';

// Setup Mock LocalStorage, Document and Window for Node test environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => storageMock[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    storageMock[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storageMock[key];
  }),
  clear: vi.fn(() => {
    for (const k in storageMock) delete storageMock[k];
  }),
};

const mockAnchor = {
  href: '',
  download: '',
  click: vi.fn(),
};

(global as any).window = {
  localStorage: mockLocalStorage,
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
(global as any).localStorage = mockLocalStorage;
(global as any).document = {
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
  createElement: vi.fn((tag: string) => {
    if (tag === 'a') return mockAnchor;
    return {};
  }),
};
(global as any).Blob = class Blob {
  content: any[];
  options: any;
  constructor(content: any[], options?: any) {
    this.content = content;
    this.options = options;
  }
};
(global as any).URL = {
  createObjectURL: vi.fn().mockReturnValue('blob:test'),
  revokeObjectURL: vi.fn(),
};

import {
  isFileSyncSupported,
  hasDirectDiskAccess,
  triggerJsonDownload,
  getSyncFileName,
  disconnectSyncFile,
} from '../oneDriveSync';

describe('oneDriveSync universal support', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('reports isFileSyncSupported as true in browser environment', () => {
    expect(isFileSyncSupported()).toBe(true);
  });

  it('correctly detects direct disk access based on File System Access API presence', () => {
    // In our mock, showOpenFilePicker is not defined
    expect(hasDirectDiskAccess()).toBe(false);

    // If showOpenFilePicker is added to window:
    (global as any).window.showOpenFilePicker = vi.fn();
    (global as any).window.showSaveFilePicker = vi.fn();
    expect(hasDirectDiskAccess()).toBe(true);

    delete (global as any).window.showOpenFilePicker;
    delete (global as any).window.showSaveFilePicker;
  });

  it('triggers JSON download safely without throwing', () => {
    expect(() => {
      triggerJsonDownload('test.json', { test: true });
    }).not.toThrow();

    expect(document.body.appendChild).toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('correctly retrieves and disconnects sync file name from localStorage cache', async () => {
    localStorage.setItem('shadow_onedrive_sync_filename', 'my-sync.json');
    const fileName = await getSyncFileName();
    expect(fileName).toBe('my-sync.json');

    await disconnectSyncFile();
    expect(localStorage.getItem('shadow_onedrive_sync_filename')).toBeNull();
  });
});
