import { getPaloAltoAdvisoryDetails } from '../src/paloaltoscrape';
import * as fs from 'fs';
import * as path from 'path';

describe('PaloAlto Scraping Tests', () => {
  const testDataDir = path.join(__dirname, 'paloalto');

  test('CVE-2025-0139: Privilege Escalation Vulnerability', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'CVE-2025-0139.json'), 'utf8'));
    const result = await getPaloAltoAdvisoryDetails(jsonData);

    console.log('CVE-2025-0139 MetaData:', JSON.stringify(result.metaData, null, 2));
    console.log('CVE-2025-0139 Details:', JSON.stringify(result.details, null, 2));

    // Verify metadata extraction
    expect(result.metaData.cve_id).toBe('CVE-2025-0139');
    expect(result.metaData.cvss_v4_base_score).toBeDefined();
    expect(result.metaData.baseSeverity).toBeDefined();
    expect(result.metaData.threatSeverity).toBeDefined();
    expect(result.metaData.vulnerabilityResponseEffort).toBeDefined();
    expect(result.metaData.providerUrgency).toBeDefined();

    // Verify details extraction
    expect(result.details.length).toBeGreaterThan(0);
    expect(result.details[0].version).toContain('Palo Alto Networks');
  });

  test('CVE-2025-0125: Multiple affected products', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'CVE-2025-0125.json'), 'utf8'));
    const result = await getPaloAltoAdvisoryDetails(jsonData);

    console.log('CVE-2025-0125 MetaData:', JSON.stringify(result.metaData, null, 2));
    console.log('CVE-2025-0125 Details:', JSON.stringify(result.details, null, 2));

    // Verify metadata
    expect(result.metaData.cve_id).toBe('CVE-2025-0125');
    expect(result.metaData.cvss_v4_base_score).toBeDefined();

    // Should have multiple products
    expect(result.details.length).toBeGreaterThan(1);
  });

  test('CVE-2025-2183: GlobalProtect App vulnerability', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'CVE-2025-2183.json'), 'utf8'));
    const result = await getPaloAltoAdvisoryDetails(jsonData);

    console.log('CVE-2025-2183 MetaData:', JSON.stringify(result.metaData, null, 2));
    console.log('CVE-2025-2183 Details:', JSON.stringify(result.details, null, 2));

    // Verify metadata
    expect(result.metaData.cve_id).toBe('CVE-2025-2183');
    expect(result.metaData.baseSeverity).toBeDefined();

    // Should contain GlobalProtect
    expect(result.details.some(detail => detail.version.includes('GlobalProtect'))).toBe(true);
  });

  test('PAN-SA-2025-0014: Chromium vulnerability update', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'PAN-SA-2025-0014.json'), 'utf8'));
    const result = await getPaloAltoAdvisoryDetails(jsonData);

    console.log('PAN-SA-2025-0014 MetaData:', JSON.stringify(result.metaData, null, 2));
    console.log('PAN-SA-2025-0014 Details:', JSON.stringify(result.details, null, 2));

    // This might be a different format (informational)
    expect(result.metaData).toBeDefined();
    expect(result.details.length).toBeGreaterThan(0);
  });

  test('CVE-2025-4230: Command injection vulnerability', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'CVE-2025-4230.json'), 'utf8'));
    const result = await getPaloAltoAdvisoryDetails(jsonData);

    console.log('CVE-2025-4230 MetaData:', JSON.stringify(result.metaData, null, 2));
    console.log('CVE-2025-4230 Details:', JSON.stringify(result.details, null, 2));

    // Verify metadata
    expect(result.metaData.cve_id).toBe('CVE-2025-4230');
    expect(result.metaData.cvss_v4_base_score).toBeDefined();

    // Should contain PAN-OS
    expect(result.details.some(detail => detail.version.includes('PAN-OS'))).toBe(true);
  });

  test('All test files should be parseable', () => {
    const files = fs.readdirSync(testDataDir);
    expect(files.length).toBe(5);

    files.forEach(file => {
      const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, file), 'utf8'));
      expect(jsonData.containers).toBeDefined();
      expect(jsonData.containers.cna).toBeDefined();
      expect(jsonData.cveMetadata).toBeDefined();
    });
  });
});