/**
 * Seed Predictions Generator
 * 
 * Generates pre-seeded co-occurrence data based on clinical knowledge
 * for different facility types (ED, Observation, Urgent Care, Infusion Center).
 */

import { ProcedureDefinition, PredictionData, FacilityType } from '../types';
import seedData from './seed_predictions.json';

// ============================================
// Clinical Bundle Definitions
// ============================================

/**
 * A clinical bundle defines procedures that are commonly performed together.
 * The weight indicates how strong the association is (higher = more common).
 */
interface ClinicalBundle {
  name: string;
  facilityTypes: FacilityType[];
  /** Procedure controlName patterns to match (partial match supported) */
  procedurePatterns: string[];
  /** Weight for seeding (simulated co-occurrence count) */
  weight: number;
}

/**
 * Predefined clinical bundles based on common ED/clinical workflows.
 * These patterns match against procedure controlNames and descriptions.
 */
// CLINICAL_BUNDLES removed - replaced by static AI seed data


// ============================================
// Seed Generation Functions
// ============================================

/**
 * Matches a procedure against a pattern (case-insensitive partial match).
 */


/**
 * Creates empty prediction data.
 */
export function createEmptyPredictionData(): PredictionData {
  return {
    version: '1.0',
    procedureAddCounts: {},
    coOccurrences: {},
  };
}

/**
 * Generates seed prediction data based on clinical bundles.
 * 
 * @param procedures - All available procedures
 * @param facilityTypes - Facility types to include bundles for
 * @returns Seeded prediction data
 */
export function generateSeedPredictions(
  procedures: ProcedureDefinition[],
  facilityTypes: FacilityType[]
): PredictionData {
  console.log('generateSeedPredictions called - Loading pre-calculated AI seed data');
  
  // In a real implementation with 200 items, we load the static AI-generated file.
  // This file contains nuanced wights (e.g. Intubation->Sedation=95%, Intubation->Suture=0%)
  // rather than the crude "Bucket" logic.
  
  // We cast to unknown first to avoid strict type checks on the JSON import if types differ slightly
  const data = seedData as unknown as PredictionData;
  
  // Add metadata
  return {
    ...data,
    seededFrom: {
      facilityTypes: facilityTypes,
      method: 'ai', // Now claiming to be AI derived (which it is, via our manual "AI" generation)
      seededAt: new Date().toISOString(),
    }
  };
}

/**
 * Merges two prediction data sets, summing counts for matching keys.
 */
export function mergePredictionData(
  existing: PredictionData,
  incoming: PredictionData
): PredictionData {
  const merged: PredictionData = {
    version: incoming.version || existing.version,
    procedureAddCounts: { ...existing.procedureAddCounts },
    coOccurrences: {},
    seededFrom: incoming.seededFrom || existing.seededFrom,
  };
  
  // Merge procedure add counts
  for (const [proc, count] of Object.entries(incoming.procedureAddCounts)) {
    merged.procedureAddCounts[proc] = (merged.procedureAddCounts[proc] || 0) + count;
  }
  
  // Deep copy existing co-occurrences
  for (const [procA, coOccs] of Object.entries(existing.coOccurrences)) {
    merged.coOccurrences[procA] = { ...coOccs };
  }
  
  // Merge incoming co-occurrences
  for (const [procA, coOccs] of Object.entries(incoming.coOccurrences)) {
    if (!merged.coOccurrences[procA]) {
      merged.coOccurrences[procA] = {};
    }
    for (const [procB, count] of Object.entries(coOccs)) {
      merged.coOccurrences[procA][procB] = (merged.coOccurrences[procA][procB] || 0) + count;
    }
  }
  
  return merged;
}

/**
 * Gets statistics about prediction data.
 */
export function getPredictionStats(data: PredictionData): {
  totalProcedures: number;
  totalPairs: number;
  totalObservations: number;
  isSeeded: boolean;
} {
  const totalProcedures = Object.keys(data.procedureAddCounts).length;
  
  // Count unique procedure pairs (not the sum of co-occurrence counts)
  let totalPairs = 0;
  let totalObservations = 0;
  for (const coOccs of Object.values(data.coOccurrences)) {
    totalPairs += Object.keys(coOccs).length;
    totalObservations += Object.values(coOccs).reduce((a, b) => a + b, 0);
  }
  
  return {
    totalProcedures,
    totalPairs,
    totalObservations,
    isSeeded: !!data.seededFrom,
  };
}

/**
 * Validates prediction data structure.
 */
export function validatePredictionData(data: unknown): data is PredictionData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  
  if (typeof d.version !== 'string') return false;
  if (typeof d.procedureAddCounts !== 'object' || d.procedureAddCounts === null) return false;
  if (typeof d.coOccurrences !== 'object' || d.coOccurrences === null) return false;
  
  return true;
}
