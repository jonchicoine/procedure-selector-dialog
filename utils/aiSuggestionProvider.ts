/**
 * AI Suggestion Provider Abstraction
 * 
 * Provides a unified interface for getting procedure suggestions,
 * with support for local statistical analysis and future AI providers.
 */

import { ProcedureDefinition, ProcedureSuggestion, PredictionData, SuggestionSettings } from '../types';

// ============================================
// Provider Interface
// ============================================

/**
 * Interface for suggestion providers.
 * Implementations can use local statistics, LLMs, or other methods.
 */
export interface SuggestionProvider {
  /** Get suggestions based on current session context */
  getSuggestions(
    sessionControlNames: string[],
    allProcedures: ProcedureDefinition[],
    predictionData: PredictionData,
    threshold: number,
    maxResults?: number
  ): ProcedureSuggestion[];
  
  /** Check if this provider is available/configured */
  isAvailable(): boolean;
  
  /** Provider name for display */
  readonly name: string;
}

// ============================================
// Constants
// ============================================

/** Minimum times a procedure must be added before we make predictions about it */
export const MIN_SAMPLE_SIZE = 2;

/** Minimum co-occurrence count to consider a relationship meaningful */
export const MIN_COOCCURRENCE_COUNT = 1;

/** Default max number of suggestions to return */
export const DEFAULT_MAX_SUGGESTIONS = 10;

// ============================================
// Variant Detection
// ============================================

/**
 * Extracts the "base procedure" name by removing age/size/location qualifiers.
 * Examples:
 *   "Central Line >= 5 years old" -> "central line"
 *   "Central line < 5 years old" -> "central line"
 *   "Lumbar Puncture (Adult)" -> "lumbar puncture"
 *   "IO Access - Tibial" -> "io access"
 */
function getBaseProcedureName(description: string): string {
  return description
    .toLowerCase()
    // Remove age qualifiers
    .replace(/\s*[<>=]+\s*\d+\s*(years?\s*old|yo|y\.?o\.?|months?|days?)\s*/gi, '')
    // Remove parenthetical qualifiers like (Adult), (Pediatric), (Infant)
    .replace(/\s*\([^)]*\)\s*/g, '')
    // Remove dash qualifiers like "- Tibial", "- Femoral"
    .replace(/\s*-\s*[a-z]+\s*$/gi, '')
    // Remove size qualifiers
    .replace(/\s*(small|medium|large|adult|pediatric|infant|neonate)\s*/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two procedures are variants of the same base procedure.
 * This prevents suggesting "Central Line < 5 years old" when 
 * "Central Line >= 5 years old" is already in the session.
 */
function areProcedureVariants(procA: ProcedureDefinition, procB: ProcedureDefinition): boolean {
  const baseA = getBaseProcedureName(procA.description);
  const baseB = getBaseProcedureName(procB.description);
  
  // If they have the same base name and are different procedures, they're variants
  return baseA === baseB && procA.controlName !== procB.controlName;
}

// ============================================
// Local Statistical Provider
// ============================================

/**
 * Provides suggestions based on locally tracked co-occurrence patterns.
 * Uses statistical analysis of procedure addition history.
 * 
 * The algorithm combines evidence from multiple procedures in the session:
 * - Each procedure in the session that has co-occurred with a candidate
 *   provides independent evidence for that candidate
 * - Multiple signals are combined using a "noisy-OR" probability model
 * - This means if A suggests D at 40% and B suggests D at 30%, 
 *   the combined confidence is 1 - (1-0.4)(1-0.3) = 58%
 * - More procedures in the session = stronger combined predictions
 */
export class LocalStatisticalProvider implements SuggestionProvider {
  readonly name = 'Local Statistical';
  
  isAvailable(): boolean {
    return true; // Always available - uses local data
  }
  
  getSuggestions(
    sessionControlNames: string[],
    allProcedures: ProcedureDefinition[],
    predictionData: PredictionData,
    threshold: number,
    maxResults: number = DEFAULT_MAX_SUGGESTIONS
  ): ProcedureSuggestion[] {
    if (sessionControlNames.length === 0) {
      return [];
    }
    
    const { procedureAddCounts, coOccurrences } = predictionData;
    
    // Build a quick lookup map for procedures
    const procedureMap = new Map<string, ProcedureDefinition>();
    for (const proc of allProcedures) {
      procedureMap.set(proc.controlName, proc);
    }
    
    // Set of procedures already in session (to exclude from suggestions)
    const sessionSet = new Set(sessionControlNames);
    
    // Get actual procedure objects for session items (for variant detection)
    const sessionProcedures: ProcedureDefinition[] = [];
    for (const controlName of sessionControlNames) {
      const proc = procedureMap.get(controlName);
      if (proc) sessionProcedures.push(proc);
    }
    
    // Helper to check if a candidate is a variant of any session procedure
    const isVariantOfSessionProcedure = (candidate: ProcedureDefinition): boolean => {
      return sessionProcedures.some(sessionProc => areProcedureVariants(sessionProc, candidate));
    };
    
    // Collect individual confidence values for each candidate from each session procedure
    // candidateEvidence[candidateId] = array of individual confidence values (0-1)
    const candidateEvidence = new Map<string, number[]>();
    const candidateCoOccurrences = new Map<string, number>();
    
    for (const sessionProc of sessionControlNames) {
      const sessionProcCoOccurrences = coOccurrences[sessionProc];
      if (!sessionProcCoOccurrences) continue;
      
      const sessionProcAddCount = procedureAddCounts[sessionProc] || 0;
      if (sessionProcAddCount < MIN_SAMPLE_SIZE) continue;
      
      for (const [candidateProc, coCount] of Object.entries(sessionProcCoOccurrences)) {
        // Skip if already in session or not a valid procedure
        if (sessionSet.has(candidateProc)) continue;
        if (!procedureMap.has(candidateProc)) continue;
        if (coCount < MIN_COOCCURRENCE_COUNT) continue;
        
        // Skip if this is a variant of a procedure already in session
        // (e.g., don't suggest "Central Line < 5yo" when "Central Line >= 5yo" is in session)
        const candidateProcedure = procedureMap.get(candidateProc)!;
        if (isVariantOfSessionProcedure(candidateProcedure)) continue;
        
        // Individual confidence from this session procedure (as decimal 0-1)
        const confidence = coCount / sessionProcAddCount;
        
        // Add to evidence array
        const existing = candidateEvidence.get(candidateProc);
        if (existing) {
          existing.push(confidence);
          candidateCoOccurrences.set(candidateProc, (candidateCoOccurrences.get(candidateProc) || 0) + coCount);
        } else {
          candidateEvidence.set(candidateProc, [confidence]);
          candidateCoOccurrences.set(candidateProc, coCount);
        }
      }
    }
    
    // Convert to array with combined confidence using noisy-OR model
    const suggestions: ProcedureSuggestion[] = [];
    
    for (const [controlName, evidenceArray] of candidateEvidence) {
      // Noisy-OR combination: P(D) = 1 - ∏(1 - P_i)
      // If A suggests D at 40% and B suggests D at 30%:
      // Combined = 1 - (0.6 * 0.7) = 1 - 0.42 = 58%
      const combinedConfidence = 1 - evidenceArray.reduce((acc, p) => acc * (1 - p), 1);
      const combinedPercent = combinedConfidence * 100;
      
      if (combinedPercent < threshold) continue;
      
      const procedure = procedureMap.get(controlName);
      if (!procedure) continue;
      
      suggestions.push({
        procedure,
        confidence: Math.round(combinedPercent),
        coOccurrenceCount: candidateCoOccurrences.get(controlName) || 0,
        // Track how many session procedures contributed to this suggestion
        contributingProcedures: evidenceArray.length,
      });
    }
    
    // Sort by confidence (desc), then by number of contributing procedures (desc), then by co-occurrence count (desc)
    suggestions.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // More contributing procedures = stronger signal
      const aContrib = (a as any).contributingProcedures || 1;
      const bContrib = (b as any).contributingProcedures || 1;
      if (bContrib !== aContrib) {
        return bContrib - aContrib;
      }
      return b.coOccurrenceCount - a.coOccurrenceCount;
    });
    
    return suggestions.slice(0, maxResults);
  }
}

// ============================================
// Gemini Provider (Stub for future implementation)
// ============================================

/**
 * Provides suggestions using Google's Gemini AI.
 * Currently a stub - returns empty results until configured.
 */
export class GeminiProvider implements SuggestionProvider {
  readonly name = 'Gemini AI';
  private apiKey?: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }
  
  isAvailable(): boolean {
    // Not available until API key is configured and we implement the integration
    return false;
  }
  
  getSuggestions(
    _sessionControlNames: string[],
    _allProcedures: ProcedureDefinition[],
    _predictionData: PredictionData,
    _threshold: number,
    _maxResults: number = DEFAULT_MAX_SUGGESTIONS
  ): ProcedureSuggestion[] {
    // TODO: Implement Gemini API integration
    // For now, return empty array
    console.log('GeminiProvider: Not yet implemented. API key present:', !!this.apiKey);
    return [];
  }
  
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// ============================================
// Provider Factory
// ============================================

/**
 * Creates the appropriate suggestion provider based on settings.
 */
export function createSuggestionProvider(settings: SuggestionSettings): SuggestionProvider {
  switch (settings.aiProvider) {
    case 'gemini':
      return new GeminiProvider(settings.aiApiKey);
    case 'local':
    default:
      return new LocalStatisticalProvider();
  }
}

/**
 * Gets the default provider (local statistical).
 */
export function getDefaultProvider(): SuggestionProvider {
  return new LocalStatisticalProvider();
}
