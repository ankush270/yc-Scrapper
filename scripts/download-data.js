import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_URL = 'https://yc-oss.github.io/api/companies/all.json';
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'yc_companies.json');

async function downloadData() {
  console.log(`Fetching YC startup data from: ${DATA_URL}...`);
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: HTTP status ${response.status}`);
    }
    const data = await response.json();
    
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    console.log(`Saving ${data.length} companies to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('Data successfully saved! YC database ready for local exploration.');
  } catch (error) {
    console.error('Error downloading YC data:', error);
    process.exit(1);
  }
}

downloadData();
