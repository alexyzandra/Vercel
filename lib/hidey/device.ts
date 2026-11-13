// Screen check: what the browser can detect on its own, plus the per-device
// list of display settings a grown-up has to confirm by hand.
//
// A web page cannot read brightness, Night Shift / True Tone, eye-comfort
// modes or the screen colour mode. So we identify the device family and show
// the exact settings to check for it.

export type DeviceFamily = 'iphone' | 'ipad' | 'samsung' | 'pixel' | 'android' | 'desktop';

export interface DeviceInfo {
  family: DeviceFamily;
  /** Model string when the browser exposes one (Android Chrome), else null. */
  model: string | null;
}

export const FAMILY_LABEL: Record<DeviceFamily, string> = {
  iphone: 'iPhone',
  ipad: 'iPad',
  samsung: 'Samsung Galaxy',
  pixel: 'Google Pixel',
  android: 'Android device',
  desktop: 'Computer',
};

function familyFromModel(model: string | null): DeviceFamily {
  if (model && /^(SM-|SC-|SCV|SCG|GT-)|samsung/i.test(model)) return 'samsung';
  if (model && /^Pixel/i.test(model)) return 'pixel';
  return 'android';
}

interface UADataLike {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }>;
}

export async function detectDevice(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return { family: 'iphone', model: null };
  // iPadOS reports itself as a Mac; a touch screen gives it away.
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return { family: 'ipad', model: null };
  }
  if (/Android/.test(ua)) {
    let model: string | null = null;
    const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
    try {
      const hints = await uaData?.getHighEntropyValues?.(['model']);
      if (hints?.model) model = hints.model;
    } catch {
      // Hint refused; fall back to the UA string.
    }
    if (!model) {
      const m = ua.match(/Android [\d.]+; ([^;)]+?)(?: Build\/|\))/);
      // Chrome's reduced UA string reports every phone as "K".
      if (m && m[1] !== 'K') model = m[1].trim();
    }
    return { family: familyFromModel(model), model };
  }
  return { family: 'desktop', model: null };
}

export interface ManualStep {
  id: string;
  title: string;
  /** Where to find it on this device. */
  where: string;
}

const ROOM: ManualStep = {
  id: 'room',
  title: 'No glare on the screen, and the screen is clean',
  where: 'Sit somewhere evenly lit, away from direct sun or a lamp reflecting off the glass.',
};

export const MANUAL_STEPS: Record<DeviceFamily, ManualStep[]> = {
  iphone: [
    { id: 'bright', title: 'Brightness is up to about three-quarters or more', where: 'Control Centre brightness slider.' },
    { id: 'warm', title: 'Night Shift and True Tone are off', where: 'Settings › Display & Brightness.' },
    { id: 'filters', title: 'Colour Filters and Reduce White Point are off', where: 'Settings › Accessibility › Display & Text Size.' },
    ROOM,
  ],
  ipad: [
    { id: 'bright', title: 'Brightness is up to about three-quarters or more', where: 'Control Centre brightness slider.' },
    { id: 'warm', title: 'Night Shift and True Tone are off', where: 'Settings › Display & Brightness.' },
    { id: 'filters', title: 'Colour Filters and Reduce White Point are off', where: 'Settings › Accessibility › Display & Text Size.' },
    ROOM,
  ],
  samsung: [
    { id: 'mode', title: 'Screen mode is set to Natural (not Vivid)', where: 'Settings › Display › Screen mode. Vivid boosts colours and can make hidden dots visible.' },
    { id: 'bright', title: 'Brightness is up, Adaptive brightness is off', where: 'Settings › Display.' },
    { id: 'warm', title: 'Eye comfort shield is off', where: 'Settings › Display › Eye comfort shield.' },
    { id: 'filters', title: 'Colour correction and colour filters are off', where: 'Settings › Accessibility › Vision enhancements.' },
    ROOM,
  ],
  pixel: [
    { id: 'mode', title: 'Colours are set to Natural (not Adaptive)', where: 'Settings › Display › Colours. Adaptive boosts colours and can make hidden dots visible.' },
    { id: 'bright', title: 'Brightness is up, Adaptive brightness is off', where: 'Settings › Display.' },
    { id: 'warm', title: 'Night Light is off', where: 'Settings › Display › Night Light.' },
    { id: 'filters', title: 'Colour correction is off', where: 'Settings › Accessibility › Colour and motion.' },
    ROOM,
  ],
  android: [
    { id: 'mode', title: 'Screen colour mode is Natural, Standard or sRGB', where: 'Settings › Display › Colours or Screen mode. Avoid Vivid, Saturated or Adaptive.' },
    { id: 'bright', title: 'Brightness is up, automatic brightness is off', where: 'Settings › Display.' },
    { id: 'warm', title: 'Night light, eye comfort or reading mode is off', where: 'Settings › Display.' },
    { id: 'filters', title: 'Colour correction is off', where: 'Settings › Accessibility.' },
    ROOM,
  ],
  desktop: [
    { id: 'bright', title: 'Screen brightness is up', where: 'Keyboard brightness keys or display settings.' },
    { id: 'warm', title: 'Night light / Night Shift is off', where: 'Windows: Settings › System › Display. Mac: System Settings › Displays. Also quit apps like f.lux.' },
    { id: 'filters', title: 'Colour filters are off', where: 'Windows: Settings › Accessibility › Colour filters. Mac: System Settings › Accessibility › Display.' },
    ROOM,
  ],
};

export interface AutoCheck {
  id: string;
  ok: boolean;
  label: string;
  detail?: string;
}

function mq(query: string): boolean {
  return typeof matchMedia === 'function' && matchMedia(query).matches;
}

/** True if the canvas hands back exactly the colours we draw into it. */
function canvasIsFaithful(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    const samples: [number, number, number][] = [[200, 60, 120], [40, 170, 90], [128, 128, 128]];
    return samples.every(([r, g, b]) => {
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, 4, 4);
      const d = ctx.getImageData(1, 1, 1, 1).data;
      return Math.abs(d[0] - r) <= 1 && Math.abs(d[1] - g) <= 1 && Math.abs(d[2] - b) <= 1;
    });
  } catch {
    return false;
  }
}

export function runAutoChecks(): AutoCheck[] {
  const inverted = mq('(inverted-colors: inverted)');
  const forced = mq('(forced-colors: active)');
  const highContrast = mq('(prefers-contrast: more)');
  const faithful = canvasIsFaithful();
  const small = Math.min(window.innerWidth, window.innerHeight) < 300;
  const wide = mq('(color-gamut: p3)');
  return [
    {
      id: 'invert',
      ok: !inverted && !forced,
      label: inverted || forced ? 'Colour inversion or high-contrast colours are on' : 'Colours are not inverted',
      detail: inverted || forced ? 'Turn this off in Accessibility settings, then reload.' : undefined,
    },
    {
      id: 'contrast',
      ok: !highContrast,
      label: highContrast ? 'Increase Contrast is on' : 'Contrast setting is standard',
      detail: highContrast ? 'Turn it off in Accessibility settings, then reload.' : undefined,
    },
    {
      id: 'canvas',
      ok: faithful,
      label: faithful ? 'Browser draws colours exactly' : 'This browser is altering drawn colours',
      detail: faithful ? undefined : 'A privacy setting or extension is changing colours. Try Safari or Chrome with extensions off.',
    },
    {
      id: 'size',
      ok: !small,
      label: small ? 'Screen is very small' : 'Screen is big enough',
      detail: small ? 'Use a phone or tablet in full-screen.' : undefined,
    },
    {
      id: 'gamut',
      ok: true,
      label: wide ? 'Wide-colour screen (colours are managed by the browser)' : 'Standard-colour (sRGB) screen',
    },
  ];
}

/** What the desktop app reads from the operating system (see desktop/win-settings.js). */
export interface NativeScreenReport {
  deviceLabel: string;
  checks: AutoCheck[];
  /** Ids of manual steps the app has verified itself, so the parent isn't asked. */
  covered: string[];
  extraSteps: ManualStep[];
}

/** Real screen settings when running inside the desktop app, otherwise null. */
export async function getNativeReport(): Promise<NativeScreenReport | null> {
  const api = (window as Window & { hideyNative?: { getScreenSettings: () => Promise<NativeScreenReport> } }).hideyNative;
  if (!api) return null;
  try {
    const report = await api.getScreenSettings();
    if (mq('(dynamic-range: high)')) {
      report.checks.push({
        id: 'hdr',
        ok: false,
        label: 'HDR is on',
        detail: 'HDR changes how colours are shown. Turn it off in Settings › System › Display, then press “Check again”.',
      });
    }
    return report;
  } catch {
    return null;
  }
}
