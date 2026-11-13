// Reads Windows display settings that a web page cannot see, and turns them
// into the check rows the game's "Get the screen ready" page displays.
//
// Reading is done with one PowerShell call (no native modules to compile).

const { execFile } = require('node:child_process');

// Night light has no public API. Windows stores its state in this binary
// registry value; byte 18 is 0x15 when night light is on and 0x13 when off.
// This is undocumented and may change between Windows versions, so anything
// else is reported as "unknown" and the parent is asked to check by hand.
const NIGHT_LIGHT_KEY =
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\DefaultAccount\\Current\\' +
  'default$windows.data.bluelightreduction.bluelightreductionstate\\' +
  'windows.data.bluelightreduction.bluelightreductionstate';
const NIGHT_LIGHT_ON = 0x15;
const NIGHT_LIGHT_OFF = 0x13;

const SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$r = @{}
# Built-in laptop panels only; external monitors do not report brightness.
$b = Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness
if ($b) { $r.brightness = [int]@($b)[0].CurrentBrightness }
$cf = Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Microsoft\\ColorFiltering'
if ($cf) { $r.colorFilter = [int]$cf.Active } else { $r.colorFilter = 0 }
$nl = (Get-ItemProperty -LiteralPath '${NIGHT_LIGHT_KEY}').Data
if ($nl -and $nl.Length -gt 18) { $r.nightLightByte = [int]$nl[18] }
$r.flux = [bool](Get-Process -Name flux)
$r | ConvertTo-Json -Compress
`;

/** Raw settings from Windows, or null when not on Windows or the read fails. */
function readRaw() {
  // Lets the interpreting code be exercised on a non-Windows machine.
  if (process.env.HIDEY_FAKE_RAW) return Promise.resolve(JSON.parse(process.env.HIDEY_FAKE_RAW));
  if (process.platform !== 'win32') return Promise.resolve(null);
  const encoded = Buffer.from(SCRIPT, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { timeout: 15000, windowsHide: true },
      (err, stdout) => {
        if (err) return resolve(null);
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          resolve(null);
        }
      },
    );
  });
}

const MIN_BRIGHTNESS = 70;

/**
 * @param {object|null} raw output of readRaw()
 * @param {{label?: string, internal?: boolean}} display the screen the window is on
 * @returns report consumed by lib/hidey/device.ts (NativeScreenReport)
 */
function interpret(raw, display) {
  const checks = [];
  const covered = []; // manual checklist steps we no longer need to ask about
  const extraSteps = [];
  const again = ' Then press “Check again”.';

  const name = display.label || 'Unknown screen';
  const external = display.internal === false;
  const deviceLabel = `Windows PC · ${name}${external ? ' (external monitor)' : display.internal ? ' (built-in screen)' : ''}`;

  if (!raw) {
    checks.push({ id: 'native', ok: false, label: 'Couldn’t read Windows display settings', detail: 'Please go through the checklist below by hand.' });
    return { deviceLabel, checks, covered, extraSteps };
  }

  if (typeof raw.brightness === 'number') {
    const ok = raw.brightness >= MIN_BRIGHTNESS;
    checks.push({
      id: 'bright',
      ok,
      label: `Brightness is at ${raw.brightness}%`,
      detail: ok ? undefined : `Turn it up to ${MIN_BRIGHTNESS}% or more in Settings › System › Display.${again}`,
    });
    covered.push('bright');
  }

  if (raw.nightLightByte === NIGHT_LIGHT_ON || raw.nightLightByte === NIGHT_LIGHT_OFF) {
    const on = raw.nightLightByte === NIGHT_LIGHT_ON;
    checks.push({
      id: 'nightlight',
      ok: !on,
      label: on ? 'Night light is on' : 'Night light is off',
      detail: on ? `Turn it off in Settings › System › Display.${again}` : undefined,
    });
    covered.push('warm');
  }

  if (raw.flux) {
    checks.push({ id: 'flux', ok: false, label: 'f.lux is running', detail: `Quit f.lux from the system tray.${again}` });
  }

  if (typeof raw.colorFilter === 'number') {
    const on = raw.colorFilter === 1;
    checks.push({
      id: 'filters',
      ok: !on,
      label: on ? 'A Windows colour filter is on' : 'Windows colour filters are off',
      detail: on ? `Turn it off in Settings › Accessibility › Colour filters.${again}` : undefined,
    });
    covered.push('filters');
  }

  if (external) {
    // A monitor's own picture mode lives inside the monitor; Windows can't see it.
    extraSteps.push({
      id: 'monitor',
      title: 'The monitor’s own picture mode is Standard or sRGB',
      where: 'Use the buttons on the monitor. Avoid Vivid, Game, Warm or low-blue-light modes.',
    });
  }

  return { deviceLabel, checks, covered, extraSteps };
}

async function getScreenReport(display) {
  return interpret(await readRaw(), display);
}

module.exports = { interpret, getScreenReport, readRaw, NIGHT_LIGHT_ON, NIGHT_LIGHT_OFF };
