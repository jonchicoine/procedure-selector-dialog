
// Legacy interface - kept for backward compatibility during migration
export interface Procedure {
  category: string;
  subcategory: string;
  description: string;
  controlName: string;
  options: string[];
}

// ============================================
// New Configurable Procedure Definition Types
// ============================================

/**
 * Defines a single input field for a procedure.
 * Fields are only needed for procedures that require additional user input.
 */
export interface ProcedureFieldDefinition {
  /** The type of input control to render */
  type: 'textbox' | 'number' | 'list' | 'checkbox';
  /** Display label for the field */
  label: string;
  /** Control name identifier for this field (used for data binding) */
  controlName: string;
  /** List items - required when type is 'list' */
  listItems?: string[];
}

/**
 * Defines a procedure in the configurable system.
 * Procedures with no fields are added immediately on click.
 * Procedures with fields show a form to capture input values.
 */
export interface ProcedureDefinition {
  /** Primary category for grouping */
  category: string;
  /** Secondary grouping within category */
  subcategory: string;
  /** Human-readable procedure name */
  description: string;
  /** Control name identifier for the procedure itself */
  controlName: string;
  /** Input fields for this procedure. Empty array = immediate add, no form needed */
  fields: ProcedureFieldDefinition[];
}

/**
 * Root configuration object for import/export.
 */
export interface ProcedureConfig {
  /** Schema version for future compatibility */
  version: string;
  /** List of all procedure definitions */
  procedures: ProcedureDefinition[];
}

/**
 * Represents a procedure that has been selected by the user,
 * including any field values they entered.
 */
export interface SelectedProcedure {
  /** Unique identifier for this selection instance */
  id: string;
  /** Reference to the procedure definition */
  category: string;
  subcategory: string;
  description: string;
  controlName: string;
  /** Copy of field definitions for this procedure */
  fields: ProcedureFieldDefinition[];
  /** Values entered by user, keyed by field controlName */
  fieldValues: Record<string, string | number>;
  /** Date the procedure was performed */
  date: string;
  /** Physician who performed the procedure */
  physician: string;
}
