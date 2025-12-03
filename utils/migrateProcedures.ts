import { Procedure, ProcedureDefinition, ProcedureFieldDefinition, ProcedureConfig } from '../types';

/**
 * Migrates legacy Procedure[] to the new ProcedureDefinition[] format.
 * 
 * Rules:
 * - If procedure has options, create a 'list' field with those options
 * - If procedure has no options, fields array is empty (immediate add on click)
 * - Procedure-level controlName is preserved
 * - Field-level controlName is set to the procedure's controlName (for list fields)
 * 
 * Special handling:
 * - Procedural Sedation: adds a 'number' field for duration
 */
export function migrateProceduresToConfig(procedures: Procedure[]): ProcedureConfig {
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
      category: proc.category,
      subcategory: proc.subcategory,
      description: proc.description,
      controlName: proc.controlName,
      fields,
    });
  }

  return {
    version: '1.0.0',
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
 * Parses a JSON string into a ProcedureConfig.
 * Throws an error if the JSON is invalid or doesn't match expected structure.
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

  // Validate each procedure
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
      if (!['textbox', 'number', 'list'].includes(field.type)) {
        throw new Error(`Invalid field type "${field.type}" at procedure ${i}, field ${j}`);
      }
      if (field.type === 'list' && (!Array.isArray(field.listItems) || field.listItems.length === 0)) {
        throw new Error(`List field at procedure ${i}, field ${j} must have listItems`);
      }
    }
  }

  return parsed as ProcedureConfig;
}
