import { 
  Procedure, 
  ProcedureDefinition, 
  ProcedureFieldDefinition, 
  ProcedureConfig,
  CategoryDefinition,
  SubcategoryDefinition,
} from '../types';

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
 * Migrates legacy Procedure[] to the new ProcedureConfig format.
 * 
 * Rules:
 * - Extracts unique categories and subcategories from procedures
 * - Creates CategoryDefinition and SubcategoryDefinition entries
 * - If procedure has options, create a 'list' field with those options
 * - If procedure has no options, fields array is empty (immediate add on click)
 * - Procedure-level controlName is preserved
 * - Field-level controlName is set to the procedure's controlName (for list fields)
 * 
 * Special handling:
 * - Procedural Sedation: adds a 'number' field for duration
 */
export function migrateProceduresToConfig(procedures: Procedure[]): ProcedureConfig {
  // Extract unique categories
  const categoryNames = new Set<string>();
  const subcategoryNames = new Set<string>();
  
  for (const proc of procedures) {
    if (proc.category) categoryNames.add(proc.category);
    if (proc.subcategory) subcategoryNames.add(proc.subcategory);
  }
  
  // Create category definitions
  const sortedCategoryNames = Array.from(categoryNames).sort();
  const categories: CategoryDefinition[] = sortedCategoryNames.map((name, index) => ({
    id: slugify(name),
    name,
    sortOrder: (index + 1) * 10,
  }));
  
  // Create subcategory definitions
  const sortedSubcategoryNames = Array.from(subcategoryNames).sort();
  const subcategories: SubcategoryDefinition[] = sortedSubcategoryNames.map((name, index) => ({
    id: slugify(name),
    name,
    sortOrder: (index + 1) * 10,
  }));
  
  // Create lookup maps
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    categoryMap.set(cat.name, cat.id);
  }
  
  const subcategoryMap = new Map<string, string>();
  for (const subcat of subcategories) {
    subcategoryMap.set(subcat.name, subcat.id);
  }
  
  // Migrate procedures
  const migratedProcedures: ProcedureDefinition[] = [];

  for (const proc of procedures) {
    const fields: ProcedureFieldDefinition[] = [];

    // If procedure has options, create a list field
    if (proc.options && proc.options.length > 0) {
      fields.push({
        type: 'list',
        label: proc.description,
        controlName: proc.controlName,
        listItems: [...proc.options],
      });
    }

    // Special case: Procedural Sedation gets a duration number field
    if (proc.controlName === 'Procedures02_ProceduralSedation_cbo') {
      fields.push({
        type: 'number',
        label: 'Duration (in mins)',
        controlName: 'Procedures02_ProceduralSedationDuration_txt',
      });
    }

    migratedProcedures.push({
      categoryId: categoryMap.get(proc.category) || slugify(proc.category),
      subcategoryId: subcategoryMap.get(proc.subcategory) || slugify(proc.subcategory || 'general'),
      description: proc.description,
      controlName: proc.controlName,
      fields,
    });
  }

  return {
    version: '2.0.0',
    categories,
    subcategories,
    procedures: migratedProcedures,
  };
}

/**
 * Converts a ProcedureConfig to a formatted JSON string for export.
 */
export function configToJson(config: ProcedureConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Validates a CategoryDefinition object.
 */
function validateCategory(cat: unknown, index: number): void {
  if (typeof cat !== 'object' || cat === null) {
    throw new Error(`Invalid category at index ${index}: must be an object`);
  }
  const c = cat as Record<string, unknown>;
  if (!c.id || typeof c.id !== 'string') {
    throw new Error(`Invalid category at index ${index}: missing or invalid "id" field`);
  }
  if (!c.name || typeof c.name !== 'string') {
    throw new Error(`Invalid category at index ${index}: missing or invalid "name" field`);
  }
  if (typeof c.sortOrder !== 'number') {
    throw new Error(`Invalid category at index ${index}: missing or invalid "sortOrder" field`);
  }
}

/**
 * Validates a SubcategoryDefinition object.
 */
function validateSubcategory(subcat: unknown, index: number): void {
  if (typeof subcat !== 'object' || subcat === null) {
    throw new Error(`Invalid subcategory at index ${index}: must be an object`);
  }
  const s = subcat as Record<string, unknown>;
  if (!s.id || typeof s.id !== 'string') {
    throw new Error(`Invalid subcategory at index ${index}: missing or invalid "id" field`);
  }
  if (!s.name || typeof s.name !== 'string') {
    throw new Error(`Invalid subcategory at index ${index}: missing or invalid "name" field`);
  }
  if (typeof s.sortOrder !== 'number') {
    throw new Error(`Invalid subcategory at index ${index}: missing or invalid "sortOrder" field`);
  }
}

/**
 * Parses a JSON string into a ProcedureConfig.
 * Throws an error if the JSON is invalid or doesn't match expected structure.
 * Supports both v1 (legacy) and v2 (with shared categories) formats.
 */
export function parseConfigJson(json: string): ProcedureConfig {
  const parsed = JSON.parse(json);

  // Basic validation
  if (!parsed.version || typeof parsed.version !== 'string') {
    throw new Error('Invalid config: missing or invalid "version" field');
  }
  if (!Array.isArray(parsed.procedures)) {
    throw new Error('Invalid config: "procedures" must be an array');
  }

  // Check if this is v2 format (with categories and subcategories arrays)
  const isV2 = Array.isArray(parsed.categories) && Array.isArray(parsed.subcategories);

  if (isV2) {
    // Validate categories
    for (let i = 0; i < parsed.categories.length; i++) {
      validateCategory(parsed.categories[i], i);
    }

    // Validate subcategories
    for (let i = 0; i < parsed.subcategories.length; i++) {
      validateSubcategory(parsed.subcategories[i], i);
    }

    // Validate each procedure (v2 format with categoryId/subcategoryId)
    for (let i = 0; i < parsed.procedures.length; i++) {
      const proc = parsed.procedures[i];
      if (!proc.categoryId || !proc.description || !proc.controlName) {
        throw new Error(`Invalid procedure at index ${i}: missing required fields (categoryId, description, controlName)`);
      }
      if (!Array.isArray(proc.fields)) {
        throw new Error(`Invalid procedure at index ${i}: "fields" must be an array`);
      }

      // Validate each field
      for (let j = 0; j < proc.fields.length; j++) {
        const field = proc.fields[j];
        if (!field.type || !field.label || !field.controlName) {
          throw new Error(`Invalid field at procedure ${i}, field ${j}: missing required fields`);
        }
        if (!['textbox', 'number', 'list', 'checkbox'].includes(field.type)) {
          throw new Error(`Invalid field type "${field.type}" at procedure ${i}, field ${j}`);
        }
        if (field.type === 'list' && (!Array.isArray(field.listItems) || field.listItems.length === 0)) {
          throw new Error(`List field at procedure ${i}, field ${j} must have listItems`);
        }
      }
    }
  } else {
    // Legacy v1 format - migrate on the fly
    // Validate each procedure (v1 format with category/subcategory strings)
    for (let i = 0; i < parsed.procedures.length; i++) {
      const proc = parsed.procedures[i];
      if (!proc.category || !proc.description || !proc.controlName) {
        throw new Error(`Invalid procedure at index ${i}: missing required fields`);
      }
      if (!Array.isArray(proc.fields)) {
        throw new Error(`Invalid procedure at index ${i}: "fields" must be an array`);
      }

      // Validate each field
      for (let j = 0; j < proc.fields.length; j++) {
        const field = proc.fields[j];
        if (!field.type || !field.label || !field.controlName) {
          throw new Error(`Invalid field at procedure ${i}, field ${j}: missing required fields`);
        }
        if (!['textbox', 'number', 'list', 'checkbox'].includes(field.type)) {
          throw new Error(`Invalid field type "${field.type}" at procedure ${i}, field ${j}`);
        }
        if (field.type === 'list' && (!Array.isArray(field.listItems) || field.listItems.length === 0)) {
          throw new Error(`List field at procedure ${i}, field ${j} must have listItems`);
        }
      }
    }

    // Migrate v1 to v2 format
    const legacyProcedures: Procedure[] = parsed.procedures.map((p: { category: string; subcategory: string; description: string; controlName: string; fields: ProcedureFieldDefinition[] }) => ({
      category: p.category,
      subcategory: p.subcategory,
      description: p.description,
      controlName: p.controlName,
      options: p.fields.find(f => f.type === 'list')?.listItems || [],
    }));

    // Use the migration function to convert
    const categoryNames = new Set<string>();
    const subcategoryNames = new Set<string>();
    
    for (const proc of legacyProcedures) {
      if (proc.category) categoryNames.add(proc.category);
      if (proc.subcategory) subcategoryNames.add(proc.subcategory);
    }
    
    const sortedCategoryNames = Array.from(categoryNames).sort();
    const categories: CategoryDefinition[] = sortedCategoryNames.map((name, index) => ({
      id: slugify(name),
      name,
      sortOrder: (index + 1) * 10,
    }));
    
    const sortedSubcategoryNames = Array.from(subcategoryNames).sort();
    const subcategories: SubcategoryDefinition[] = sortedSubcategoryNames.map((name, index) => ({
      id: slugify(name),
      name,
      sortOrder: (index + 1) * 10,
    }));
    
    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      categoryMap.set(cat.name, cat.id);
    }
    
    const subcategoryMap = new Map<string, string>();
    for (const subcat of subcategories) {
      subcategoryMap.set(subcat.name, subcat.id);
    }

    const migratedProcedures: ProcedureDefinition[] = parsed.procedures.map((p: { category: string; subcategory: string; description: string; controlName: string; fields: ProcedureFieldDefinition[] }) => ({
      categoryId: categoryMap.get(p.category) || slugify(p.category),
      subcategoryId: subcategoryMap.get(p.subcategory) || slugify(p.subcategory || 'general'),
      description: p.description,
      controlName: p.controlName,
      fields: p.fields,
    }));

    return {
      version: '2.0.0',
      categories,
      subcategories,
      procedures: migratedProcedures,
    };
  }

  return parsed as ProcedureConfig;
}
