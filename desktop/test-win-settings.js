// Checks how raw Windows readings are turned into screen-check rows.
const assert = require('node:assert');
const { interpret, NIGHT_LIGHT_ON, NIGHT_LIGHT_OFF } = require('./win-settings');

const row = (report, id) => report.checks.find((c) => c.id === id);

// Laptop with everything set correctly.
let r = interpret({ brightness: 90, colorFilter: 0, nightLightByte: NIGHT_LIGHT_OFF, flux: false }, { label: 'Built-in', internal: true });
assert.ok(r.checks.every((c) => c.ok));
assert.deepStrictEqual(r.covered.sort(), ['bright', 'filters', 'warm']);
assert.strictEqual(r.extraSteps.length, 0);
assert.match(r.deviceLabel, /built-in screen/);

// Laptop that is dim, warm-tinted, filtered and running f.lux.
r = interpret({ brightness: 30, colorFilter: 1, nightLightByte: NIGHT_LIGHT_ON, flux: true }, { label: 'Built-in', internal: true });
for (const id of ['bright', 'nightlight', 'filters', 'flux']) assert.strictEqual(row(r, id).ok, false, id);

// Desktop PC: no brightness reading, unknown night-light byte, external monitor.
r = interpret({ colorFilter: 0, nightLightByte: 0x99, flux: false }, { label: 'DELL U2720Q', internal: false });
assert.strictEqual(row(r, 'bright'), undefined);
assert.strictEqual(row(r, 'nightlight'), undefined);
assert.deepStrictEqual(r.covered, ['filters']); // brightness + warm modes stay on the manual list
assert.strictEqual(r.extraSteps[0].id, 'monitor');
assert.match(r.deviceLabel, /DELL U2720Q \(external monitor\)/);

// PowerShell failed entirely: say so and cover nothing.
r = interpret(null, { label: 'X', internal: true });
assert.strictEqual(r.checks[0].ok, false);
assert.deepStrictEqual(r.covered, []);

console.log('win-settings: all checks passed');
