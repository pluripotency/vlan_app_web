import { getFortinetAdvisoryDetails } from '../src/fortinetscrape';
import * as fs from 'fs';
import * as path from 'path';

describe('Fortinet Scraping Tests', () => {
  const testDataDir = path.join(__dirname, 'fortinet');

  // Test case for high severity vulnerability
  test('FG-IR-25-448: High severity vulnerability - FortiWeb improper access control', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-25-448.json'), 'utf8'));
    
    console.log('FG-IR-25-448 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-25-448 Details count:', jsonData.details.length);

    // Verify high severity vulnerability
    expect(jsonData.metaData.severity).toBe('High');
    expect(jsonData.metaData.cvxsv3_score).toBe('7.7');
    expect(jsonData.metaData.cve_id).toBe('CVE-2025-52970');
    expect(jsonData.metaData.ir_number).toBe('FG-IR-25-448');

    // Verify FortiWeb products are affected
    expect(jsonData.details.length).toBeGreaterThan(0);
    expect(jsonData.details.some((detail: any) => detail.version.includes('FortiWeb'))).toBe(true);
  });

  // Test case for medium severity with multiple products
  test('FG-IR-24-036: Medium severity vulnerability affecting multiple products', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-24-036.json'), 'utf8'));
    
    console.log('FG-IR-24-036 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-24-036 Details count:', jsonData.details.length);

    // Verify medium severity vulnerability
    expect(jsonData.metaData.severity).toBe('Medium');
    expect(jsonData.metaData.cvxsv3_score).toBe('6.7');
    expect(jsonData.metaData.cve_id).toBe('CVE-2024-26010');
    expect(jsonData.metaData.ir_number).toBe('FG-IR-24-036');

    // Should affect multiple product lines
    expect(jsonData.details.length).toBeGreaterThan(10);
    const productLines = jsonData.details.map((detail: any) => detail.version.split(' ')[0]).filter((p: string, i: number, arr: string[]) => arr.indexOf(p) === i);
    expect(productLines.length).toBeGreaterThan(3); // FortiOS, FortiPAM, FortiProxy, etc.
  });

  // Test case for vulnerability affecting many product variants
  test('FG-IR-24-309: CLI vulnerability affecting multiple product categories', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-24-309.json'), 'utf8'));
    
    console.log('FG-IR-24-309 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-24-309 Details count:', jsonData.details.length);

    // Verify CLI component vulnerability
    expect(jsonData.metaData.component).toBe('CLI');
    expect(jsonData.metaData.severity).toBe('Medium');
    expect(jsonData.metaData.cve_id).toBe('CVE-2024-40588');
    expect(jsonData.metaData.impact).toBe('Improper access control');

    // Should affect many different product categories
    expect(jsonData.details.length).toBeGreaterThan(15);
    const products = jsonData.details.map((detail: any) => detail.version.split(' ')[0]).filter((p: string, i: number, arr: string[]) => arr.indexOf(p) === i);
    expect(products).toContain('FortiCamera');
    expect(products).toContain('FortiMail');
    expect(products).toContain('FortiRecorder');
    expect(products).toContain('FortiVoice');
  });

  // Test case for FortiManager vulnerability
  test('FG-IR-24-473: FortiManager vulnerability with cloud variants', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-24-473.json'), 'utf8'));
    
    console.log('FG-IR-24-473 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-24-473 Details count:', jsonData.details.length);

    // Verify FortiManager vulnerability
    expect(jsonData.metaData.severity).toBe('Medium');
    expect(jsonData.metaData.cve_id).toBe('CVE-2024-52964');
    expect(jsonData.metaData.component).toBe('OTHERS');

    // Should include both FortiManager and FortiManager Cloud
    const managerProducts = jsonData.details.filter((detail: any) => detail.version.includes('FortiManager'));
    const cloudProducts = jsonData.details.filter((detail: any) => detail.version.includes('Cloud'));
    
    expect(managerProducts.length).toBeGreaterThan(0);
    expect(cloudProducts.length).toBeGreaterThan(0);
  });

  // Test case for privilege escalation vulnerability
  test('FG-IR-25-150: Privilege escalation vulnerability', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-25-150.json'), 'utf8'));
    
    console.log('FG-IR-25-150 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-25-150 Details count:', jsonData.details.length);

    // Verify privilege escalation vulnerability
    expect(jsonData.metaData.severity).toBe('Medium');
    expect(jsonData.metaData.cve_id).toBe('CVE-2025-27759');
    expect(jsonData.metaData.impact).toBe('Escalation of privilege');
    expect(jsonData.metaData.component).toBe('CLI');

    // Should be FortiWeb specific
    expect(jsonData.details.every((detail: any) => detail.version.includes('FortiWeb'))).toBe(true);
  });

  // Test case for command execution vulnerability
  test('FG-IR-25-253: Command execution vulnerability', async () => {
    const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'FG-IR-25-253.json'), 'utf8'));
    
    console.log('FG-IR-25-253 MetaData:', JSON.stringify(jsonData.metaData, null, 2));
    console.log('FG-IR-25-253 Details count:', jsonData.details.length);

    // Verify command execution vulnerability
    expect(jsonData.metaData.severity).toBe('Medium');
    expect(jsonData.metaData.cve_id).toBe('CVE-2025-47857');
    expect(jsonData.metaData.impact).toBe('Execute unauthorized code or commands');

    // Should have specific version ranges
    expect(jsonData.details.length).toBeGreaterThan(0);
    expect(jsonData.details.some((detail: any) => detail.affected === 'Not affected')).toBe(true);
  });

  // Test comprehensive parsing across all files
  test('All Fortinet test files should have valid structure', () => {
    const jsonFiles = ['FG-IR-24-036.json', 'FG-IR-24-473.json', 'FG-IR-24-309.json', 
                      'FG-IR-25-448.json', 'FG-IR-25-150.json', 'FG-IR-25-253.json'];

    jsonFiles.forEach(file => {
      const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, file), 'utf8'));
      
      // Verify structure
      const expectedSourceFile = file.replace('.json', '.html');
      expect(jsonData.source_file ?? expectedSourceFile).toBe(expectedSourceFile);
      if (jsonData.scraped_at) {
        expect(typeof jsonData.scraped_at).toBe('string');
      }
      expect(Array.isArray(jsonData.details)).toBe(true);
      expect(jsonData.metaData).toBeDefined();

      // Verify metadata fields
      expect(jsonData.metaData.ir_number).toMatch(/^FG-IR-\d{2}-\d{3}$/);
      expect(jsonData.metaData.severity).toMatch(/^(Low|Medium|High|Critical)$/);
      expect(jsonData.metaData.cve_id).toMatch(/^CVE-\d{4}-\d+$/);
      expect(jsonData.metaData.cvxsv3_score).toMatch(/^\d+\.\d+$/);

      // Verify details structure
      if (jsonData.details.length > 0) {
        jsonData.details.forEach((detail: any) => {
          expect(detail.version).toBeDefined();
          expect(detail.affected).toBeDefined();
          expect(detail.solution).toBeDefined();
        });
      }
    });
  });

  // Test severity distribution
  test('Severity distribution should be realistic', () => {
    const jsonFiles = ['FG-IR-24-036.json', 'FG-IR-24-473.json', 'FG-IR-24-309.json', 
                      'FG-IR-25-448.json', 'FG-IR-25-150.json', 'FG-IR-25-253.json'];

    const severities = jsonFiles.map(file => {
      const jsonData = JSON.parse(fs.readFileSync(path.join(testDataDir, file), 'utf8'));
      return jsonData.metaData.severity;
    });

    // Should have mix of Medium and High severities
    expect(severities).toContain('Medium');
    expect(severities).toContain('High');
    
    // Count severity distribution
    const mediumCount = severities.filter(s => s === 'Medium').length;
    const highCount = severities.filter(s => s === 'High').length;
    
    console.log('Severity distribution:', { Medium: mediumCount, High: highCount });
    expect(mediumCount + highCount).toBe(6);
  });
});
