/**
 * Host collect must pull an adb-visible path. Release is not debuggable, so
 * run-as cannot read private filesDir on typical physical devices.
 */
const fs = require('fs');

const script = fs.readFileSync('scripts/collect-report.sh', 'utf8');
const executable = script
  .split('\n')
  .filter((line: string) => !/^\s*#/.test(line))
  .join('\n');

describe('collect-report.sh report I/O', () => {
  it('does not use run-as to read or wait on the report', () => {
    expect(executable).not.toMatch(/run-as/);
  });

  it('pulls app-specific external storage and the Downloads mirror', () => {
    expect(script).toMatch(/Android\/data\/\$\{APP_ID\}\/files/);
    expect(script).toMatch(/Download\/\$\{PUBLIC_REPORT_NAME\}/);
    expect(script).toMatch(/pull_device_report/);
    expect(script).toMatch(/pull "\$\{src\}"/);
  });

  it('fails clearly if wait passes but pull cannot read the file', () => {
    expect(script).toMatch(/REPORT_READY seen but adb could not pull/);
  });

  it('refuses to collect if a leftover report survives clear', () => {
    expect(script).toMatch(/assert_device_reports_absent/);
    expect(script).toMatch(/leftover report still on device after clear/);
    expect(executable).toMatch(
      /content delete --uri content:\/\/media\/external\/downloads/,
    );
  });

  it('force-stops successfully before clearing reports, then starts', () => {
    const forceStop = executable.lastIndexOf('am force-stop');
    const clearCall = executable.lastIndexOf('clear_device_reports');
    const absentCall = executable.lastIndexOf('assert_device_reports_absent');
    const start = executable.lastIndexOf('am start');
    expect(forceStop).toBeGreaterThan(-1);
    expect(clearCall).toBeGreaterThan(forceStop);
    expect(absentCall).toBeGreaterThan(clearCall);
    expect(start).toBeGreaterThan(absentCall);
    const forceStopLine = executable
      .split('\n')
      .find((line: string) => line.includes('am force-stop'));
    expect(forceStopLine).toBeDefined();
    expect(forceStopLine).not.toMatch(/\|\|\s*true/);
  });

  it('checks the pulled report axes and sample count', () => {
    expect(executable).toMatch(/accept-collected-report\.cjs/);
    expect(executable).toMatch(/"\$\{CANDIDATE_KIND\}"/);
    expect(executable).toMatch(/"\$\{PATTERN\}"/);
    expect(executable).toMatch(/"\$\{COUNT\}"/);
    expect(executable).toMatch(/"\$\{CONTROL\}"/);
    expect(executable).toMatch(/"\$\{SAMPLES\}"/);
  });
});
