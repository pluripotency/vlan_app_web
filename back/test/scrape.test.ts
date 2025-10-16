import fs from 'fs';
import path from 'path';
import { getFortinetAdvisoryDetails } from '../src/fortinetscrape';

describe('getAdvisoryDetails', () => {
  it('should parse FG-IR-24-036.html and output FG-IR-24-036.json', async () => {
    // Read the test HTML file from local test directory
    const htmlFilename = 'FG-IR-24-036.html';
    const candidatePaths = [
      path.join(__dirname, htmlFilename),
      path.join(__dirname, 'fortinet', htmlFilename)
    ];
    const htmlPath = candidatePaths.find(candidate => fs.existsSync(candidate));
    if (!htmlPath) {
      throw new Error(`Fixture ${htmlFilename} not found in test directory`);
    }
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Call the HTML parsing function directly with local test data
    const result = await getFortinetAdvisoryDetails(htmlContent);
    
    // Write the actual result to a JSON file for inspection/comparison
    const outputPath = path.join(path.dirname(htmlPath), 'FG-IR-24-036.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    // Basic structure validation
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('metaData');
    
    // Validate that details is an array
    expect(Array.isArray(result.details)).toBe(true);
    
    // Check that we have some details (affected versions)
    expect(result.details.length).toBeGreaterThan(0);
    
    // Validate structure of first detail item if exists
    if (result.details.length > 0) {
      const firstDetail = result.details[0];
      expect(firstDetail).toHaveProperty('version');
      expect(firstDetail).toHaveProperty('affected');
      expect(firstDetail).toHaveProperty('solution');
      expect(typeof firstDetail.version).toBe('string');
      expect(typeof firstDetail.affected).toBe('string');
      expect(typeof firstDetail.solution).toBe('string');
    }
    
    // Validate metaData structure
    expect(typeof result.metaData).toBe('object');
    
    // Log results for manual inspection
    console.log(`Test completed. Output saved to: ${outputPath}`);
    console.log(`Found ${result.details.length} affected versions`);
    console.log(`First few details:`, result.details.slice(0, 3));
    console.log(`Metadata:`, result.metaData);
    
    // Additional specific validation based on expected content
    // (These assertions can be adjusted based on what's actually in the HTML)
    if (result.details.length > 0) {
      // Check that we're getting FortiOS versions
      const fortiOSVersions = result.details.filter((detail: any) => 
        detail.version.toLowerCase().includes('fortios')
      );
      expect(fortiOSVersions.length).toBeGreaterThan(0);
      
      // Check that solutions contain upgrade information
      const upgradeInstructions = result.details.filter((detail: any) => 
        detail.solution.toLowerCase().includes('upgrade')
      );
      expect(upgradeInstructions.length).toBeGreaterThan(0);
    }
  });

  it('should handle empty HTML gracefully', async () => {
    const result = await getFortinetAdvisoryDetails('');
    
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('metaData');
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details).toHaveLength(0);
    expect(typeof result.metaData).toBe('object');
  });

  it('should handle HTML without version tables', async () => {
    const htmlWithoutTables = `
      <html>
        <body>
          <h1>Advisory Title</h1>
          <p>Some description without version tables.</p>
        </body>
      </html>
    `;
    
    const result = await getFortinetAdvisoryDetails(htmlWithoutTables);
    
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('metaData');
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details).toHaveLength(0);
  });

  it('should extract metadata from 2-column tables', async () => {
    const htmlWithMetadata = `
      <html>
        <body>
          <table>
            <tr><td>IR Number</td><td>FG-IR-24-036</td></tr>
            <tr><td>Published Date</td><td>2024-02-14</td></tr>
            <tr><td>Severity</td><td>High</td></tr>
            <tr><td>CVE</td><td>CVE-2024-1234</td></tr>
            <tr><td>Impact</td><td>Remote Code Execution</td></tr>
          </table>
        </body>
      </html>
    `;
    
    const result = await getFortinetAdvisoryDetails(htmlWithMetadata);
    
    expect(result.metaData.ir_number).toBe('FG-IR-24-036');
    expect(result.metaData.published_date).toBe('2024-02-14');
    expect(result.metaData.severity).toBe('High');
    expect(result.metaData.cve_id).toBe('CVE-2024-1234');
    expect(result.metaData.impact).toBe('Remote Code Execution');
  });
});
