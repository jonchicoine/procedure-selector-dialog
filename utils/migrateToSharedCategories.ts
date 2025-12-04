/**
 * Migration script to convert procedures.json from inline category/subcategory strings
 * to shared CategoryDefinition and SubcategoryDefinition references.
 * 
 * Run with: npx ts-node utils/migrateToSharedCategories.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OldProcedure {
  category: string;
  subcategory: string;
  description: string;
  controlName: string;
  fields: Array<{
    type: string;
    label: string;
    controlName: string;
    listItems?: string[];
  }>;
}

interface OldConfig {
  version: string;
  procedures: OldProcedure[];
}

interface CategoryDefinition {
  id: string;
  name: string;
  sortOrder: number;
}

interface SubcategoryDefinition {
  id: string;
  name: string;
  sortOrder: number;
}

interface NewProcedure {
  categoryId: string;
  subcategoryId: string;
  description: string;
  controlName: string;
  fields: Array<{
    type: string;
    label: string;
    controlName: string;
    listItems?: string[];
  }>;
}

interface NewConfig {
  version: string;
  categories: CategoryDefinition[];
  subcategories: SubcategoryDefinition[];
  procedures: NewProcedure[];
}

/**
 * Convert a display name to a slug ID.
 * e.g., "Foreign Body Removal" -> "foreign-body-removal"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract unique categories from old procedures and generate definitions.
 */
function extractCategories(procedures: OldProcedure[]): CategoryDefinition[] {
  const categoryNames = new Set<string>();
  
  for (const proc of procedures) {
    if (proc.category) {
      categoryNames.add(proc.category);
    }
  }
  
  // Sort alphabetically and assign sortOrder
  const sortedNames = Array.from(categoryNames).sort((a, b) => a.localeCompare(b));
  
  return sortedNames.map((name, index) => ({
    id: slugify(name),
    name,
    sortOrder: (index + 1) * 10, // Use increments of 10 for easy reordering
  }));
}

/**
 * Extract unique subcategories from old procedures and generate definitions.
 */
function extractSubcategories(procedures: OldProcedure[]): SubcategoryDefinition[] {
  const subcategoryNames = new Set<string>();
  
  for (const proc of procedures) {
    if (proc.subcategory) {
      subcategoryNames.add(proc.subcategory);
    }
  }
  
  // Sort alphabetically and assign sortOrder
  const sortedNames = Array.from(subcategoryNames).sort((a, b) => a.localeCompare(b));
  
  return sortedNames.map((name, index) => ({
    id: slugify(name),
    name,
    sortOrder: (index + 1) * 10, // Use increments of 10 for easy reordering
  }));
}

/**
 * Transform old procedures to use categoryId and subcategoryId references.
 */
function transformProcedures(
  oldProcedures: OldProcedure[],
  categoryMap: Map<string, string>,
  subcategoryMap: Map<string, string>
): NewProcedure[] {
  return oldProcedures.map(proc => ({
    categoryId: categoryMap.get(proc.category) || slugify(proc.category),
    subcategoryId: subcategoryMap.get(proc.subcategory) || slugify(proc.subcategory || 'general'),
    description: proc.description,
    controlName: proc.controlName,
    fields: proc.fields,
  }));
}

/**
 * Main migration function.
 */
function migrate(): void {
  // Read the old config
  const inputPath = path.join(__dirname, '..', 'procedures.json');
  const outputPath = path.join(__dirname, '..', 'procedures.json');
  
  console.log(`Reading from: ${inputPath}`);
  
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const oldConfig: OldConfig = JSON.parse(rawData);
  
  console.log(`Found ${oldConfig.procedures.length} procedures`);
  
  // Extract categories and subcategories
  const categories = extractCategories(oldConfig.procedures);
  const subcategories = extractSubcategories(oldConfig.procedures);
  
  console.log(`Extracted ${categories.length} categories`);
  console.log(`Extracted ${subcategories.length} subcategories`);
  
  // Create lookup maps for name -> id
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.name, cat.id);
  }
  
  const subcategoryMap = new Map<string, string>();
  for (const subcat of subcategories) {
    subcategoryMap.set(subcat.name, subcat.id);
  }
  
  // Transform procedures
  const newProcedures = transformProcedures(oldConfig.procedures, categoryMap, subcategoryMap);
  
  // Create new config
  const newConfig: NewConfig = {
    version: '2.0.0', // Bump version to indicate new schema
    categories,
    subcategories,
    procedures: newProcedures,
  };
  
  // Write the new config
  const outputJson = JSON.stringify(newConfig, null, 2);
  fs.writeFileSync(outputPath, outputJson, 'utf-8');
  
  console.log(`\nMigration complete!`);
  console.log(`Output written to: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Subcategories: ${subcategories.length}`);
  console.log(`  - Procedures: ${newProcedures.length}`);
  
  // Print categories for verification
  console.log(`\nCategories:`);
  categories.forEach(cat => {
    console.log(`  ${cat.sortOrder}: ${cat.name} (${cat.id})`);
  });
  
  console.log(`\nSubcategories:`);
  subcategories.forEach(subcat => {
    console.log(`  ${subcat.sortOrder}: ${subcat.name} (${subcat.id})`);
  });
}

// Run the migration
migrate();

