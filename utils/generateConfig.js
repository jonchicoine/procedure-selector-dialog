import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawData = fs.readFileSync(path.join(__dirname, '..', 'constants.ts'), 'utf-8');

// Extract the CSV data between backticks
const match = rawData.match(/const rawProcedureData = `([\s\S]+?)`;/);
if (!match) {
  console.error('Could not find rawProcedureData');
  process.exit(1);
}

const csvData = match[1];
const lines = csvData.trim().split('\n').slice(1); // Skip header

const procedures = [];
for (const line of lines) {
  if (!line.trim()) continue;
  
  const parts = line.split(',');
  if (parts.length < 4) continue;
  
  const category = (parts[0] || '').trim() || 'General';
  const subcategory = (parts[1] || '').trim() || '';
  let description = (parts[2] || '').trim() || '';
  const controlName = (parts[3] || '').trim() || '';
  const optionsString = parts.slice(4).join(',').trim().replace(/^"|"$/g, '');
  
  // Skip the duration-only entry
  if (controlName === 'Procedures02_ProceduralSedationDuration_txt') continue;
  
  // Generate description from control name if empty
  if (!description) {
    const coreName = controlName
      .replace(/^(Procedures\d{2}_|Orthopedics_|Surgical_FBID_|Surgical_Lacerations_|Surgical_QI_|Surgical_Misc_|Surgical_)/, '')
      .replace(/_chk$|_cbo$|_txt$/, '');
    description = coreName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/(\d+)/g, ' $1')
      .trim();
  }
  
  const options = (optionsString && optionsString.toUpperCase() !== 'NA') 
    ? optionsString.split(';').map(o => o.trim()).filter(o => o)
    : [];
  
  const fields = [];
  
  // If has options, create a list field
  if (options.length > 0) {
    fields.push({
      type: 'list',
      label: description,
      controlName: controlName,
      listItems: options
    });
  }
  
  // Special case: Procedural Sedation gets duration field
  if (controlName === 'Procedures02_ProceduralSedation_cbo') {
    fields.push({
      type: 'number',
      label: 'Duration (in mins)',
      controlName: 'Procedures02_ProceduralSedationDuration_txt'
    });
  }
  
  procedures.push({
    category,
    subcategory,
    description,
    controlName,
    fields
  });
}

const config = {
  version: '1.0.0',
  procedures
};

const outputPath = path.join(__dirname, '..', 'procedures.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
console.log('Generated', outputPath);
console.log('Total procedures:', procedures.length);
console.log('With fields:', procedures.filter(p => p.fields.length > 0).length);
console.log('Without fields (immediate add):', procedures.filter(p => p.fields.length === 0).length);
