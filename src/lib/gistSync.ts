const GIST_FILENAME_PREFIX = 'ShadowTracker_';
const GIST_ID_CACHE_KEY = 'shadow_tracker_gist_id';

export interface SyncData {
  tasks: any[];
  habits: any[];
  dailyLogs: any[];
  notes: any[];
  categories: any[];
  reminders?: any[];
  settings?: any;
  moneyData?: any;
  unlockedBadges?: string[];
  version?: string;
  exportedAt?: string;
  timestamp: number;
}

function getCachedGistId(): string | null {
  try {
    const cached = localStorage.getItem(GIST_ID_CACHE_KEY);
    if (!cached) return null;
    const { id, year } = JSON.parse(cached);
    // Only use cache if it's for the current year
    if (year === new Date().getFullYear()) return id;
    return null;
  } catch {
    return null;
  }
}

function setCachedGistId(id: string) {
  localStorage.setItem(GIST_ID_CACHE_KEY, JSON.stringify({
    id,
    year: new Date().getFullYear(),
  }));
}

function cleanPat(pat: string): string {
  return (pat || '').trim();
}

export function sanitizeSettingsForCloud(settings: any): any {
  if (!settings || typeof settings !== 'object') return null;
  const sanitized = { ...settings };
  delete sanitized.githubPat;
  delete sanitized.oneDriveAccessToken;
  delete sanitized.oneDriveRefreshToken;
  return sanitized;
}

async function ghFetch(url: string, pat: string, options: RequestInit = {}) {
  const token = cleanPat(pat);
  if (!token) {
    throw new Error('GitHub Personal Access Token (PAT) is empty. Please save your PAT in Settings.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new Error(`GitHub API error 401: Bad credentials. Please double-check that your Personal Access Token (PAT) is valid and has "gists" permission.`);
    }
    throw new Error(`GitHub API error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

async function findGistByFilename(pat: string, filename: string): Promise<string | null> {
  // Search through paginated results (up to 300 gists = 3 pages)
  for (let page = 1; page <= 3; page++) {
    const res = await ghFetch(
      `https://api.github.com/gists?per_page=100&page=${page}`,
      pat
    );
    const gists = await res.json();
    if (!Array.isArray(gists) || gists.length === 0) break;

    const match = gists.find((g: any) => g.files && Object.keys(g.files).includes(filename));
    if (match) return match.id;
  }
  return null;
}

export async function getOrCreateYearlyGist(pat: string): Promise<string> {
  const year = new Date().getFullYear();
  const filename = `${GIST_FILENAME_PREFIX}${year}.json`;

  // 1. Try cached ID first — verify it still exists
  const cachedId = getCachedGistId();
  if (cachedId) {
    try {
      const res = await ghFetch(`https://api.github.com/gists/${cachedId}`, pat);
      const gist = await res.json();
      if (gist.files && gist.files[filename]) {
        return cachedId;
      }
    } catch {
      // Cache was stale, continue to search
    }
  }

  // 2. Search all gists
  const foundId = await findGistByFilename(pat, filename);
  if (foundId) {
    setCachedGistId(foundId);
    return foundId;
  }

  // 3. Create new gist
  const createRes = await ghFetch('https://api.github.com/gists', pat, {
    method: 'POST',
    body: JSON.stringify({
      description: `ShadowTracker Data Backup for ${year}`,
      public: false,
      files: {
        [filename]: {
          content: JSON.stringify({ tasks: [], habits: [], dailyLogs: [], notes: [], categories: [], reminders: [], settings: null, moneyData: null, unlockedBadges: [], version: '1.0.0', exportedAt: new Date().toISOString(), timestamp: Date.now() })
        }
      }
    }),
  });

  const newGist = await createRes.json();
  setCachedGistId(newGist.id);
  return newGist.id;
}

export async function pushToCloud(pat: string, data: SyncData): Promise<void> {
  const gistId = await getOrCreateYearlyGist(pat);
  const year = new Date().getFullYear();
  const filename = `${GIST_FILENAME_PREFIX}${year}.json`;

  await ghFetch(`https://api.github.com/gists/${gistId}`, pat, {
    method: 'PATCH',
    body: JSON.stringify({
      files: {
        [filename]: {
          content: JSON.stringify({
            tasks: data.tasks,
            habits: data.habits,
            dailyLogs: data.dailyLogs,
            notes: data.notes,
            categories: data.categories,
            reminders: data.reminders || [],
            settings: sanitizeSettingsForCloud(data.settings),
            moneyData: data.moneyData || null,
            unlockedBadges: data.unlockedBadges || [],
            version: data.version || '1.0.0',
            exportedAt: new Date().toISOString(),
            timestamp: Date.now(),
          })
        }
      }
    }),
  });
}

export async function listGitHubGistJsonFiles(pat: string): Promise<Array<{ gistId: string; filename: string; description: string; updatedAt: string }>> {
  const result: Array<{ gistId: string; filename: string; description: string; updatedAt: string }> = [];
  for (let page = 1; page <= 3; page++) {
    const res = await ghFetch(`https://api.github.com/gists?per_page=100&page=${page}`, pat);
    const gists = await res.json();
    if (!Array.isArray(gists) || gists.length === 0) break;

    for (const g of gists) {
      if (g.files) {
        for (const fname of Object.keys(g.files)) {
          if (fname.toLowerCase().endsWith('.json')) {
            result.push({
              gistId: g.id,
              filename: fname,
              description: g.description || 'Shadow Tracker Backup',
              updatedAt: g.updated_at || '',
            });
          }
        }
      }
    }
  }
  return result;
}

export async function createCustomGitHubGist(pat: string, filename: string, initialData: SyncData): Promise<{ gistId: string; filename: string }> {
  let cleanFilename = filename.trim();
  if (!cleanFilename.toLowerCase().endsWith('.json')) {
    cleanFilename += '.json';
  }

  const createRes = await ghFetch('https://api.github.com/gists', pat, {
    method: 'POST',
    body: JSON.stringify({
      description: `Shadow Tracker Backup - ${cleanFilename}`,
      public: false,
      files: {
        [cleanFilename]: {
          content: JSON.stringify({
            tasks: initialData.tasks || [],
            habits: initialData.habits || [],
            dailyLogs: initialData.dailyLogs || [],
            notes: initialData.notes || [],
            categories: initialData.categories || [],
            reminders: initialData.reminders || [],
            settings: sanitizeSettingsForCloud(initialData.settings),
            moneyData: initialData.moneyData || null,
            unlockedBadges: initialData.unlockedBadges || [],
            version: initialData.version || '1.0.0',
            exportedAt: new Date().toISOString(),
            timestamp: Date.now(),
          }),
        },
      },
    }),
  });

  const newGist = await createRes.json();
  setCachedGistId(newGist.id);
  return { gistId: newGist.id, filename: cleanFilename };
}

export async function pushToCloudGistFile(pat: string, gistId: string, filename: string, data: SyncData): Promise<void> {
  await ghFetch(`https://api.github.com/gists/${gistId}`, pat, {
    method: 'PATCH',
    body: JSON.stringify({
      files: {
        [filename]: {
          content: JSON.stringify({
            tasks: data.tasks,
            habits: data.habits,
            dailyLogs: data.dailyLogs,
            notes: data.notes,
            categories: data.categories,
            reminders: data.reminders || [],
            settings: sanitizeSettingsForCloud(data.settings),
            moneyData: data.moneyData || null,
            unlockedBadges: data.unlockedBadges || [],
            version: data.version || '1.0.0',
            exportedAt: new Date().toISOString(),
            timestamp: Date.now(),
          }),
        },
      },
    }),
  });
}

export async function pullFromCloudGistFile(pat: string, gistId: string, filename: string): Promise<SyncData | null> {
  const res = await ghFetch(`https://api.github.com/gists/${gistId}`, pat);
  const gist = await res.json();

  const file = gist.files?.[filename];
  if (!file) return null;

  let content: string;

  if (file.truncated && file.raw_url) {
    const token = cleanPat(pat);
    const rawRes = await fetch(file.raw_url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!rawRes.ok) throw new Error('Failed to fetch raw gist content.');
    content = await rawRes.text();
  } else if (file.content) {
    content = file.content;
  } else {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return {
      tasks: parsed.tasks || [],
      habits: parsed.habits || [],
      dailyLogs: parsed.dailyLogs || [],
      notes: parsed.notes || [],
      categories: parsed.categories || [],
      reminders: parsed.reminders || [],
      settings: parsed.settings || null,
      moneyData: parsed.moneyData || null,
      unlockedBadges: parsed.unlockedBadges || [],
      version: parsed.version || '1.0.0',
      exportedAt: parsed.exportedAt || null,
      timestamp: parsed.timestamp || 0,
    };
  } catch (e) {
    console.error('Failed to parse gist content:', e);
    throw new Error('Cloud data is corrupted — could not parse JSON.');
  }
}

export async function pullFromCloud(pat: string): Promise<SyncData | null> {
  const gistId = await getOrCreateYearlyGist(pat);
  const year = new Date().getFullYear();
  const filename = `${GIST_FILENAME_PREFIX}${year}.json`;
  return pullFromCloudGistFile(pat, gistId, filename);
}
