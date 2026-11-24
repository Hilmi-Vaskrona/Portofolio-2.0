import { createClient } from '@supabase/supabase-js';

export type VisitorSyncMode = 'supabase' | 'local-unconfigured';

export interface CaveVisitorRecord {
  rank: number;
  visitorUid: string;
  city: string;
  country: string;
  location: string;
  browser: string;
  os: string;
  deviceType: string;
  enteredAt: string;
  enteredAtIso: string;
  isCurrentUser?: boolean;
}

export interface VisitorsTrackingPayload {
  current: CaveVisitorRecord;
  list: CaveVisitorRecord[];
  mode: VisitorSyncMode;
}

interface CaveVisitorRow {
  id: number;
  visitor_uid: string;
  city: string;
  country: string;
  location: string;
  browser: string;
  os: string;
  device_type: string;
  entered_at: string;
}

const UID_STORAGE_KEY = 'vaskrona_cave_uid_v1';
const LOCAL_FALLBACK_KEY = 'vaskrona_real_local_visitors_v1';

let isTrackingInitialized = false;

export function formatRank(rank: number): string {
  return `#${String(Math.max(1, rank)).padStart(2, '0')}`;
}

export function formatEnteredAt(isoOrDate: string | Date): string {
  try {
    const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return '-';
  }
}

function getOrCreateVisitorUid(): string {
  try {
    const existing = localStorage.getItem(UID_STORAGE_KEY);
    if (existing && /^[0-9a-f-]{32,36}$/i.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
    localStorage.setItem(UID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return '00000000-0000-4000-8000-000000000000';
  }
}

function formatLocationLabel(city: string, country: string): string {
  const cleanCity = city.trim();
  const cleanCountry = country.trim();
  if (cleanCity && cleanCountry && cleanCity.toLowerCase() !== cleanCountry.toLowerCase()) {
    return `${cleanCity}, ${cleanCountry}`;
  }
  return cleanCountry || cleanCity || 'Unknown Location';
}

function detectTimezoneGeo(): { city: string; country: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzMap: Record<string, { city: string; country: string }> = {
      'Asia/Jakarta': { city: 'Jakarta', country: 'Indonesia' },
      'Asia/Pontianak': { city: 'Pontianak', country: 'Indonesia' },
      'Asia/Makassar': { city: 'Makassar', country: 'Indonesia' },
      'Asia/Jayapura': { city: 'Jayapura', country: 'Indonesia' },
      'Asia/Singapore': { city: 'Singapore', country: 'Singapore' },
      'Asia/Kuala_Lumpur': { city: 'Kuala Lumpur', country: 'Malaysia' },
      'Asia/Kuching': { city: 'Kuching', country: 'Malaysia' },
      'Asia/Tokyo': { city: 'Tokyo', country: 'Japan' },
      'Asia/Seoul': { city: 'Seoul', country: 'South Korea' },
      'Asia/Bangkok': { city: 'Bangkok', country: 'Thailand' },
      'Asia/Manila': { city: 'Manila', country: 'Philippines' },
      'Asia/Ho_Chi_Minh': { city: 'Ho Chi Minh', country: 'Vietnam' },
      'Asia/Shanghai': { city: 'Shanghai', country: 'China' },
      'Asia/Taipei': { city: 'Taipei', country: 'Taiwan' },
      'Asia/Hong_Kong': { city: 'Hong Kong', country: 'Hong Kong' },
      'Asia/Kolkata': { city: 'Mumbai', country: 'India' },
      'Asia/Dubai': { city: 'Dubai', country: 'United Arab Emirates' },
      'Europe/London': { city: 'London', country: 'United Kingdom' },
      'Europe/Berlin': { city: 'Berlin', country: 'Germany' },
      'Europe/Paris': { city: 'Paris', country: 'France' },
      'Europe/Amsterdam': { city: 'Amsterdam', country: 'Netherlands' },
      'America/New_York': { city: 'New York', country: 'United States' },
      'America/Chicago': { city: 'Chicago', country: 'United States' },
      'America/Denver': { city: 'Denver', country: 'United States' },
      'America/Los_Angeles': { city: 'Los Angeles', country: 'United States' },
      'America/Toronto': { city: 'Toronto', country: 'Canada' },
      'Australia/Sydney': { city: 'Sydney', country: 'Australia' },
      'Australia/Melbourne': { city: 'Melbourne', country: 'Australia' },
    };
    if (tzMap[tz]) return tzMap[tz];
    if (tz.includes('/')) {
      const parts = tz.split('/');
      return {
        city: parts[parts.length - 1].replace(/_/g, ' '),
        country: parts[0].replace(/_/g, ' '),
      };
    }
  } catch {
    // Ignore timezone detection failure
  }
  return { city: '-', country: 'Unknown' };
}

function detectBrowserSync(): string {
  try {
    const navAny = navigator as any;
    if (navAny.userAgentData && Array.isArray(navAny.userAgentData.brands)) {
      for (const b of navAny.userAgentData.brands) {
        if (!b || !b.brand) continue;
        const brandName = String(b.brand);
        if (!brandName.includes('Not') && brandName !== 'Chromium') {
          if (brandName.includes('Edge')) return `Edge ${b.version}`;
          if (brandName.includes('Chrome')) return `Chrome ${b.version}`;
          if (brandName.includes('Opera')) return `Opera ${b.version}`;
          if (brandName.includes('Brave')) return `Brave ${b.version}`;
        }
      }
    }
    const ua = navigator.userAgent || '';
    let match: RegExpMatchArray | null = null;
    if ((match = ua.match(/Edg(?:A|iOS)?\/(\d+)/))) return `Edge ${match[1]}`;
    if ((match = ua.match(/(?:OPR|Opera)\/(\d+)/))) return `Opera ${match[1]}`;
    if (navAny.brave) return 'Brave';
    if ((match = ua.match(/Firefox\/(\d+)/))) return `Firefox ${match[1]}`;
    if ((match = ua.match(/Chrome\/(\d+)/)) && !ua.includes('Chromium')) return `Chrome ${match[1]}`;
    if (ua.includes('Safari') && (match = ua.match(/Version\/(\d+)/))) return `Safari ${match[1]}`;
    if (ua.includes('Safari')) return 'Safari';
  } catch {
    // Ignore UA failure
  }
  return 'Web Browser';
}

function detectOsSync(): string {
  try {
    const ua = navigator.userAgent || '';
    const navAny = navigator as any;
    const plat = String((navAny.userAgentData && navAny.userAgentData.platform) || navigator.platform || '');
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua) || (plat === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iOS';
    if (/Windows/i.test(ua) || /Win/i.test(plat)) {
      return /Windows NT 10\.0/i.test(ua) ? 'Windows 10/11' : 'Windows';
    }
    if (/Mac/i.test(ua) || /Mac/i.test(plat)) return 'macOS';
    if (/Linux/i.test(ua) || /Linux/i.test(plat)) return 'Linux';
  } catch {
    // Ignore OS failure
  }
  return 'Unknown OS';
}

async function detectPreciseOs(): Promise<string> {
  const baseOs = detectOsSync();
  try {
    const navAny = navigator as any;
    if (navAny.userAgentData?.getHighEntropyValues) {
      const ua = await navAny.userAgentData.getHighEntropyValues(['platform', 'platformVersion']);
      if (ua.platform === 'Windows' && ua.platformVersion) {
        const major = parseInt(String(ua.platformVersion).split('.')[0], 10);
        if (!Number.isNaN(major)) {
          return major >= 13 ? 'Windows 11' : 'Windows 10';
        }
      }
    }
  } catch {
    // Fallback to sync detection
  }
  return baseOs;
}

function detectDeviceTypeSync(): string {
  try {
    const ua = navigator.userAgent || '';
    const navAny = navigator as any;
    const isTablet =
      /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
      (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isTablet) return 'Tablet';
    const isMobile =
      Boolean(navAny.userAgentData?.mobile) ||
      /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
    if (isMobile) return 'Mobile (Smartphone)';
  } catch {
    // Ignore device detection failure
  }
  return 'Desktop / Laptop';
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 2400): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function detectIpGeo(): Promise<{ city: string; country: string }> {
  const primary = await fetchJsonWithTimeout('https://ipwho.is/');
  if (primary && primary.success !== false && primary.country) {
    return {
      city: String(primary.city || '').trim(),
      country: String(primary.country || '').trim(),
    };
  }

  const secondary = await fetchJsonWithTimeout('https://get.geojs.io/v1/ip/geo.json');
  if (secondary && secondary.country) {
    return {
      city: String(secondary.city || '').trim(),
      country: String(secondary.country || '').trim(),
    };
  }

  return detectTimezoneGeo();
}

export function createPreliminaryVisitor(): CaveVisitorRecord {
  const tzGeo = detectTimezoneGeo();
  const nowIso = new Date().toISOString();
  return {
    rank: 1,
    visitorUid: getOrCreateVisitorUid(),
    city: tzGeo.city,
    country: tzGeo.country,
    location: formatLocationLabel(tzGeo.city, tzGeo.country),
    browser: detectBrowserSync(),
    os: detectOsSync(),
    deviceType: detectDeviceTypeSync(),
    enteredAt: formatEnteredAt(nowIso),
    enteredAtIso: nowIso,
    isCurrentUser: true,
  };
}

function broadcastPayload(payload: VisitorsTrackingPayload) {
  (window as any).__vaskronaVisitorsData = payload;
  window.dispatchEvent(
    new CustomEvent('vaskrona:visitors-ready', {
      detail: payload,
    })
  );
}

function mapRowsToRecords(rows: CaveVisitorRow[], myUid: string): CaveVisitorRecord[] {
  return rows.map((row, idx) => ({
    rank: idx + 1,
    visitorUid: row.visitor_uid,
    city: row.city || '-',
    country: row.country || '-',
    location: row.location || formatLocationLabel(row.city || '', row.country || ''),
    browser: row.browser || 'Web Browser',
    os: row.os || 'Unknown OS',
    deviceType: row.device_type || 'Desktop / Laptop',
    enteredAt: formatEnteredAt(row.entered_at),
    enteredAtIso: row.entered_at,
    isCurrentUser: row.visitor_uid === myUid,
  }));
}

function persistLocalOnlyVisitor(scanned: CaveVisitorRecord): VisitorsTrackingPayload {
  let list: CaveVisitorRecord[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch {
    list = [];
  }

  const existingIdx = list.findIndex((item) => item.visitorUid === scanned.visitorUid);
  if (existingIdx === -1) {
    const inserted: CaveVisitorRecord = {
      ...scanned,
      rank: list.length + 1,
      isCurrentUser: true,
    };
    list.push(inserted);
  }

  list = list.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    isCurrentUser: item.visitorUid === scanned.visitorUid,
  }));

  try {
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage write errors
  }

  const current = list.find((item) => item.visitorUid === scanned.visitorUid) || {
    ...scanned,
    rank: list.length || 1,
    isCurrentUser: true,
  };

  return { current, list, mode: 'local-unconfigured' };
}

export async function initCaveVisitorTracking(): Promise<VisitorsTrackingPayload> {
  if (isTrackingInitialized && (window as any).__vaskronaVisitorsData) {
    return (window as any).__vaskronaVisitorsData as VisitorsTrackingPayload;
  }
  isTrackingInitialized = true;

  const preliminary = createPreliminaryVisitor();
  const [geo, preciseOs] = await Promise.all([detectIpGeo(), detectPreciseOs()]);

  const myUid = preliminary.visitorUid;
  const city = geo.city || preliminary.city || '-';
  const country = geo.country || preliminary.country || '-';
  const location = formatLocationLabel(city, country);
  const nowIso = new Date().toISOString();

  const scannedProfile: CaveVisitorRecord = {
    rank: 1,
    visitorUid: myUid,
    city,
    country,
    location,
    browser: preliminary.browser,
    os: preciseOs,
    deviceType: preliminary.deviceType,
    enteredAt: formatEnteredAt(nowIso),
    enteredAtIso: nowIso,
    isCurrentUser: true,
  };

  const supabaseUrl = (import.meta.env.PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    const localPayload = persistLocalOnlyVisitor(scannedProfile);
    broadcastPayload(localPayload);
    return localPayload;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    await supabase.from('cave_visitors').upsert(
      {
        visitor_uid: myUid,
        city: city.slice(0, 80),
        country: country.slice(0, 80),
        location: location.slice(0, 120),
        browser: scannedProfile.browser.slice(0, 80),
        os: scannedProfile.os.slice(0, 80),
        device_type: scannedProfile.deviceType.slice(0, 80),
      },
      { onConflict: 'visitor_uid', ignoreDuplicates: true }
    );

    const fetchAndPublish = async (): Promise<VisitorsTrackingPayload> => {
      const { data, error } = await supabase
        .from('cave_visitors')
        .select('id, visitor_uid, city, country, location, browser, os, device_type, entered_at')
        .order('id', { ascending: true });

      if (error || !Array.isArray(data) || data.length === 0) {
        throw error || new Error('Empty visitor rows');
      }

      const list = mapRowsToRecords(data as CaveVisitorRow[], myUid);
      const current =
        list.find((item) => item.visitorUid === myUid) || {
          ...scannedProfile,
          rank: list.length + 1,
        };

      const payload: VisitorsTrackingPayload = {
        current,
        list,
        mode: 'supabase',
      };
      broadcastPayload(payload);
      return payload;
    };

    const initialPayload = await fetchAndPublish();

    supabase
      .channel('cave-visitors-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cave_visitors' },
        () => {
          void fetchAndPublish().catch(() => {
            // Keep existing payload if background refresh fails
          });
        }
      )
      .subscribe();

    return initialPayload;
  } catch {
    const fallbackPayload = persistLocalOnlyVisitor(scannedProfile);
    broadcastPayload(fallbackPayload);
    return fallbackPayload;
  }
}
