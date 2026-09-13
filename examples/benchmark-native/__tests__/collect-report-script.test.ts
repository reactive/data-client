/**
 * Host collect must pull an adb-visible path. Release is not debuggable, so
 * run-as cannot read private filesDir on typical physical devices.
 */
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(
  path.join(__dirname, '../scripts/collect-report.sh'),
  'utf8',
);

describe('collect-report.sh report I/O', () => {
  it('does not use run-as to read or wait on the report', () => {
    expect(script).not.toMatch(/run-as/);
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
});
