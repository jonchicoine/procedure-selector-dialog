// Legacy interface - kept for backward compatibility during migration
export interface Procedure {
  category: string;
  subcategory: string;
  description: string;
  controlName: string;
  options: string[];
}

// ============================================
// Category and Subcategory Definition Types
// ============================================

/**
 * Defines a category for grouping procedures.
 * Categories are shared entities that procedures reference by ID.
 */
export interface CategoryDefinition {
  /** Unique identifier for this category (e.g., "gastrointestinal") */
  id: string;
  /** Display name for the category (e.g., "Gastrointestinal") */
  name: string;
  /** Display order for sorting (lower numbers appear first) */
  sortOrder: number;
}

/**
 * Defines a subcategory for secondary grouping within categories.
 * Subcategories can be shared across multiple categories.
 */
export interface SubcategoryDefinition {
  /** Unique identifier for this subcategory (e.g., "foreign-body-removal") */
  id: string;
  /** Display name for the subcategory (e.g., "Foreign Body Removal") */
  name: string;
  /** Display order for sorting within a category (lower numbers appear first) */
  sortOrder: number;
}

// ============================================
// Configurable Procedure Definition Types
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
  /** Reference to category by ID */
  categoryId: string;
  /** Reference to subcategory by ID */
  subcategoryId: string;
  /** Human-readable procedure name */
  description: string;
  /** Control name identifier for the procedure itself */
  controlName: string;
  /** Input fields for this procedure. Empty array = immediate add, no form needed */
  fields: ProcedureFieldDefinition[];
  /** Optional aliases for search (e.g., "LP" for "Lumbar Puncture") */
  aliases?: string[];
  /** Optional anatomical/contextual tags for search (e.g., "spine", "back") */
  tags?: string[];
}

/**
 * Root configuration object for import/export.
 */
export interface ProcedureConfig {
  /** Schema version for future compatibility */
  version: string;
  /** List of all category definitions */
  categories: CategoryDefinition[];
  /** List of all subcategory definitions */
  subcategories: SubcategoryDefinition[];
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
  /** Reference to the category by ID */
  categoryId: string;
  /** Reference to the subcategory by ID */
  subcategoryId: string;
  /** Human-readable procedure name */
  description: string;
  /** Control name identifier for the procedure itself */
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

// ============================================
// Prediction and Suggestion Types
// ============================================

/**
 * Facility types for clinical context and seed data generation.
 */
export type FacilityType = 'ed' | 'observation' | 'urgent-care' | 'infusion-center';

/**
 * Display names for facility types.
 */
export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  'ed': 'Emergency Department',
  'observation': 'Observation Unit',
  'urgent-care': 'Urgent Care Clinic',
  'infusion-center': 'Infusion Center',
};

/**
 * Stores learned co-occurrence patterns for procedure suggestions.
 */
export interface PredictionData {
  /** Schema version for future migrations */
  version: string;
  /** Count of times each procedure has been added (denominator for confidence) */
  procedureAddCounts: Record<string, number>;
  /** 
   * Pairwise co-occurrence counts.
   * coOccurrences[A][B] = number of times B was in the session when A was added
   */
  coOccurrences: Record<string, Record<string, number>>;
  /** Optional metadata about how the data was seeded */
  seededFrom?: {
    facilityType: FacilityType;
    method: 'rules' | 'ai';
    seededAt: string;
  };
}

/**
 * User settings for the suggestion feature.
 */
export interface SuggestionSettings {
  /** Whether suggestions are enabled */
  enabled: boolean;
  /** Confidence threshold (0-100) - only show suggestions above this % */
  threshold: number;
  /** Maximum number of suggestions to show (0-100) */
  maxSuggestions: number;
  /** Selected facility type for context */
  facilityType: FacilityType;
  /** Auto-seed prediction data with clinical bundles if empty */
  autoSeed: boolean;
  /** AI provider for suggestions ('local' uses statistical model only) */
  aiProvider: 'local' | 'gemini';
  /** API key for AI provider (only needed for non-local providers) */
  aiApiKey?: string;
}

/**
 * Default suggestion settings.
 */
export const DEFAULT_SUGGESTION_SETTINGS: SuggestionSettings = {
  enabled: true,
  threshold: 50,
  maxSuggestions: 10,
  facilityType: 'ed',
  autoSeed: false,
  aiProvider: 'local',
};

/**
 * A suggestion with its confidence score.
 */
export interface ProcedureSuggestion {
  /** The suggested procedure */
  procedure: ProcedureDefinition;
  /** Combined confidence score (0-100) from all contributing procedures */
  confidence: number;
  /** Total co-occurrence count across all contributing procedures */
  coOccurrenceCount: number;
  /** Number of procedures in the session that contributed to this suggestion */
  contributingProcedures?: number;
}

/**
 * Extended config that includes prediction data for export/import.
 */
export interface ProcedureConfigWithPredictions extends ProcedureConfig {
  /** Optional prediction data included in exports */
  predictionData?: PredictionData;
}
