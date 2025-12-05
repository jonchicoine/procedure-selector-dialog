/**
 * Seed Predictions Generator
 * 
 * Generates pre-seeded co-occurrence data based on clinical knowledge
 * for different facility types (ED, Observation, Urgent Care, Infusion Center).
 */

import { ProcedureDefinition, PredictionData, FacilityType } from '../types';

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
const CLINICAL_BUNDLES: ClinicalBundle[] = [
  // ========== ED Trauma/Resuscitation ==========
  {
    name: 'Trauma Resuscitation',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'Intubation',
      'ChestTube',
      'CentralLine',
      'ArterialCat',
      'CPR',
      'ProceduralSedation',
      'Thoracentesis',
    ],
    weight: 50,
  },
  {
    name: 'Cardiac Arrest',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'CPR',
      'Cardioversion',
      'PacerExternal',
      'PacerInternal',
      'CentralLine',
      'Intubation',
      'EndTidalCO2',
      'ArterialCat',
    ],
    weight: 60,
  },
  {
    name: 'Airway Management Bundle',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'Intubation',
      'Cricothyroidotomy',
      'Tracheostomy',
      'ProceduralSedation',
      'EndTidalCO2',
      'OxygenTherapy',
    ],
    weight: 55,
  },
  
  // ========== ED Respiratory ==========
  {
    name: 'Respiratory Distress',
    facilityTypes: ['ed', 'observation'],
    procedurePatterns: [
      'BiPap',
      'CPap',
      'Nebulizer',
      'OxygenTherapy',
      'Intubation',
      'ArterialCat',
      'EndTidalCO2',
    ],
    weight: 45,
  },
  {
    name: 'Asthma/COPD Exacerbation',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'Nebulizer',
      'OxygenTherapy',
      'BiPap',
      'CPap',
    ],
    weight: 40,
  },
  
  // ========== ED Cardiovascular ==========
  {
    name: 'Arrhythmia Management',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'Cardioversion',
      'CardiacMonitor',
      'ProceduralSedation',
      'CentralLine',
    ],
    weight: 45,
  },
  {
    name: 'Vascular Access Bundle',
    facilityTypes: ['ed', 'observation', 'infusion-center'],
    procedurePatterns: [
      'CentralLine',
      'PICCLine',
      'ArterialCat',
      'DeclotVascularDevice',
    ],
    weight: 35,
  },
  
  // ========== ED Epistaxis ==========
  {
    name: 'Epistaxis Management',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'NasalCautery',
      'NasalPackAnterior',
      'NasalPackPosterior',
      'NasalPackBalloon',
    ],
    weight: 50,
  },
  
  // ========== ED Procedures with Sedation ==========
  {
    name: 'Procedural Sedation Pairing',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'ProceduralSedation',
      'Cardioversion',
      'LumbarPuncture',
      'ChestTube',
      // Orthopedic reductions would go here
    ],
    weight: 55,
  },
  
  // ========== ED GI ==========
  {
    name: 'GI Bleed Workup',
    facilityTypes: ['ed', 'observation'],
    procedurePatterns: [
      'NGWithLavage',
      'NGWithSuction',
      'FoleyCatheter',
      'CentralLine',
    ],
    weight: 40,
  },
  {
    name: 'GI Tube Management',
    facilityTypes: ['ed', 'observation'],
    procedurePatterns: [
      'NGWithLavage',
      'NGWithSuction',
      'GTubeReposition',
      'GTubeReplacement',
    ],
    weight: 35,
  },
  
  // ========== ED Abscess/Wound Care ==========
  {
    name: 'Abscess Drainage',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'IncisionDrainage',
      'DigitialBlock',
      'BlocksForPain',
    ],
    weight: 50,
  },
  {
    name: 'Wound Care Bundle',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'IncisionDrainage',
      'Debridement',
      'WoundDehiscence',
    ],
    weight: 40,
  },
  
  // ========== ED Neuro ==========
  {
    name: 'LP Procedure',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'LumbarPuncture',
      'ProceduralSedation',
      'EpiduralBloodPatch',
    ],
    weight: 45,
  },
  
  // ========== ED Foreign Body ==========
  {
    name: 'Eye Foreign Body',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'FBCornea',
      'FBConjunctiva',
    ],
    weight: 45,
  },
  {
    name: 'ENT Foreign Body',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'ForeignBodyRemoval_Nose',
      'ForeignBodyRemoval_Ear',
      'ForeignBodyRemoval_Pharynx',
      'Laryngoscopy',
    ],
    weight: 40,
  },
  
  // ========== ED Urinary ==========
  {
    name: 'Urinary Catheterization',
    facilityTypes: ['ed', 'observation'],
    procedurePatterns: [
      'FoleyCatheter',
      'CatheterStraighCath',
      'CathForUA',
      'BladderScan',
      'IrrigationBladder',
    ],
    weight: 45,
  },
  
  // ========== Observation Unit ==========
  {
    name: 'CHF Observation',
    facilityTypes: ['observation'],
    procedurePatterns: [
      'BiPap',
      'CPap',
      'FoleyCatheter',
      'CardiacMonitor',
      'OxygenTherapy',
    ],
    weight: 40,
  },
  
  // ========== Obstetrics ==========
  {
    name: 'Delivery Bundle',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'VaginalDelivery',
      'CesareanSection',
      'NewbornResuscitation',
      'FetalNonStressTest',
    ],
    weight: 50,
  },
  
  // ========== Orthopedic/Cast ==========
  {
    name: 'Fracture Care',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'CastChangesSimpleImmob',
      'Splint',
      'DigitialBlock',
      'ProceduralSedation',
    ],
    weight: 40,
  },
  {
    name: 'Cast Management',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'RemoveLongArmCast',
      'RemoveLegCast',
      'RemoveArmCastGauntlet',
      'Bivalve',
      'WedgeCast',
      'WindowCast',
    ],
    weight: 35,
  },
  
  // ========== Burns ==========
  {
    name: 'Burn Care',
    facilityTypes: ['ed'],
    procedurePatterns: [
      'Escharotomy',
      'FirstDegree',
      'PartialThickness',
      'Debridement',
    ],
    weight: 45,
  },
  
  // ========== Infusion Center ==========
  {
    name: 'Infusion Access',
    facilityTypes: ['infusion-center'],
    procedurePatterns: [
      'PICCLine',
      'CentralLine',
      'DeclotVascularDevice',
    ],
    weight: 50,
  },
  
  // ========== Urgent Care ==========
  {
    name: 'Minor Procedures',
    facilityTypes: ['urgent-care'],
    procedurePatterns: [
      'IncisionDrainage_Skin',
      'DigitialBlock',
      'ImpactedCerumen',
      'DrainSubungualHematoma',
    ],
    weight: 35,
  },
  
  // ========== Nail Procedures ==========
  {
    name: 'Nail Procedures',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'DrainSubungualHematoma',
      'AvulsionOfNailPlate',
      'DebridementOfNail',
      'RepairOfNailbed',
      'WedgeResectionToenail',
      'ExciseIngrownToenail',
      'DigitialBlock',
    ],
    weight: 45,
  },
  
  // ========== Joint Procedures ==========
  {
    name: 'Joint Procedures',
    facilityTypes: ['ed', 'urgent-care'],
    procedurePatterns: [
      'InjectAspirateJoints',
      'GanglionCyst',
      'BlocksForPain',
    ],
    weight: 40,
  },
];

// ============================================
// Seed Generation Functions
// ============================================

/**
 * Matches a procedure against a pattern (case-insensitive partial match).
 */
function procedureMatchesPattern(proc: ProcedureDefinition, pattern: string): boolean {
  const lowerPattern = pattern.toLowerCase();
  return (
    proc.controlName.toLowerCase().includes(lowerPattern) ||
    proc.description.toLowerCase().includes(lowerPattern)
  );
}

/**
 * Finds all procedures that match any of the given patterns.
 */
function findMatchingProcedures(
  procedures: ProcedureDefinition[],
  patterns: string[]
): ProcedureDefinition[] {
  return procedures.filter(proc =>
    patterns.some(pattern => procedureMatchesPattern(proc, pattern))
  );
}

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
  console.log('generateSeedPredictions called with', procedures.length, 'procedures and facility types:', facilityTypes);
  
  const predictionData = createEmptyPredictionData();
  const { procedureAddCounts, coOccurrences } = predictionData;
  
  // Get bundles applicable to the selected facility types
  const applicableBundles = CLINICAL_BUNDLES.filter(bundle =>
    bundle.facilityTypes.some(ft => facilityTypes.includes(ft))
  );
  
  console.log('Applicable bundles:', applicableBundles.length);
  
  for (const bundle of applicableBundles) {
    const matchingProcs = findMatchingProcedures(procedures, bundle.procedurePatterns);
    
    console.log(`Bundle "${bundle.name}": ${matchingProcs.length} matching procedures from ${bundle.procedurePatterns.length} patterns`);
    if (matchingProcs.length > 0) {
      console.log('  Matched:', matchingProcs.map(p => p.controlName).slice(0, 5));
    }
    
    if (matchingProcs.length < 2) continue; // Need at least 2 procedures for co-occurrence
    
    // Create pairwise co-occurrences for all procedures in the bundle
    for (let i = 0; i < matchingProcs.length; i++) {
      const procA = matchingProcs[i].controlName;
      
      // Increment add count for this procedure
      procedureAddCounts[procA] = (procedureAddCounts[procA] || 0) + bundle.weight;
      
      // Create co-occurrence entries
      if (!coOccurrences[procA]) {
        coOccurrences[procA] = {};
      }
      
      for (let j = 0; j < matchingProcs.length; j++) {
        if (i === j) continue; // Skip self
        
        const procB = matchingProcs[j].controlName;
        coOccurrences[procA][procB] = (coOccurrences[procA][procB] || 0) + bundle.weight;
      }
    }
  }
  
  // Add metadata about seeding
  predictionData.seededFrom = {
    facilityTypes: facilityTypes,
    method: 'rules',
    seededAt: new Date().toISOString(),
  };
  
  return predictionData;
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
