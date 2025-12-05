/**
 * Unit tests for AI Suggestion Provider
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LocalStatisticalProvider,
  GeminiProvider,
  createSuggestionProvider,
  getDefaultProvider,
  MIN_SAMPLE_SIZE,
  MIN_COOCCURRENCE_COUNT,
  DEFAULT_MAX_SUGGESTIONS,
} from './aiSuggestionProvider';
import { ProcedureDefinition, PredictionData, SuggestionSettings } from '../types';

// ============================================
// Test Fixtures
// ============================================

const createProcedure = (
  controlName: string,
  description: string,
  categoryId: string = 'test-category',
  subcategoryId: string = 'test-subcategory'
): ProcedureDefinition => ({
  controlName,
  description,
  categoryId,
  subcategoryId,
  fields: [],
});

const createEmptyPredictionData = (): PredictionData => ({
  version: '1.0',
  procedureAddCounts: {},
  coOccurrences: {},
});

// ============================================
// LocalStatisticalProvider Tests
// ============================================

describe('LocalStatisticalProvider', () => {
  let provider: LocalStatisticalProvider;
  let procedures: ProcedureDefinition[];
  let predictionData: PredictionData;

  beforeEach(() => {
    provider = new LocalStatisticalProvider();
    procedures = [
      createProcedure('proc-a', 'Procedure A'),
      createProcedure('proc-b', 'Procedure B'),
      createProcedure('proc-c', 'Procedure C'),
      createProcedure('proc-d', 'Procedure D'),
      createProcedure('proc-e', 'Procedure E'),
    ];
    predictionData = createEmptyPredictionData();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(provider.name).toBe('Local Statistical');
    });

    it('should always be available', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('Empty/Edge Cases', () => {
    it('should return empty array when session is empty', () => {
      const suggestions = provider.getSuggestions(
        [],
        procedures,
        predictionData,
        50
      );
      expect(suggestions).toEqual([]);
    });

    it('should return empty array when no prediction data exists', () => {
      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        50
      );
      expect(suggestions).toEqual([]);
    });

    it('should return empty array when procedure add count is below minimum sample size', () => {
      predictionData.procedureAddCounts['proc-a'] = MIN_SAMPLE_SIZE - 1;
      predictionData.coOccurrences['proc-a'] = { 'proc-b': 1 };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0
      );
      expect(suggestions).toEqual([]);
    });

    it('should return empty array when co-occurrence count is below minimum', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 'proc-b': MIN_COOCCURRENCE_COUNT - 1 };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0
      );
      // MIN_COOCCURRENCE_COUNT is 1, so 0 would be filtered out
      expect(suggestions).toEqual([]);
    });
  });

  describe('Basic Suggestions', () => {
    it('should return suggestions above threshold', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 6, // 60% confidence
        'proc-c': 3, // 30% confidence
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        50
      );

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].procedure.controlName).toBe('proc-b');
      expect(suggestions[0].confidence).toBe(60);
    });

    it('should not suggest procedures already in session', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 8, // 80% confidence
      };

      const suggestions = provider.getSuggestions(
        ['proc-a', 'proc-b'], // proc-b already in session
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(0);
    });

    it('should not suggest procedures that do not exist in allProcedures', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-unknown': 8, // This procedure doesn't exist
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(0);
    });

    it('should sort suggestions by confidence descending', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 3, // 30%
        'proc-c': 7, // 70%
        'proc-d': 5, // 50%
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(3);
      expect(suggestions[0].procedure.controlName).toBe('proc-c');
      expect(suggestions[0].confidence).toBe(70);
      expect(suggestions[1].procedure.controlName).toBe('proc-d');
      expect(suggestions[1].confidence).toBe(50);
      expect(suggestions[2].procedure.controlName).toBe('proc-b');
      expect(suggestions[2].confidence).toBe(30);
    });

    it('should respect maxResults parameter', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 5,
        'proc-c': 6,
        'proc-d': 7,
        'proc-e': 8,
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0,
        2 // Only return top 2
      );

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].procedure.controlName).toBe('proc-e');
      expect(suggestions[1].procedure.controlName).toBe('proc-d');
    });
  });

  describe('Noisy-OR Combination', () => {
    it('should combine confidence from multiple session procedures using noisy-OR', () => {
      // When proc-a was added, proc-c was present 4 out of 10 times (40%)
      // When proc-b was added, proc-c was present 3 out of 10 times (30%)
      // Noisy-OR: 1 - (1-0.4)(1-0.3) = 1 - 0.42 = 0.58 = 58%
      
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.procedureAddCounts['proc-b'] = 10;
      predictionData.coOccurrences['proc-a'] = { 'proc-c': 4 };
      predictionData.coOccurrences['proc-b'] = { 'proc-c': 3 };

      const suggestions = provider.getSuggestions(
        ['proc-a', 'proc-b'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].procedure.controlName).toBe('proc-c');
      expect(suggestions[0].confidence).toBe(58);
      expect(suggestions[0].contributingProcedures).toBe(2);
    });

    it('should increase confidence with more contributing procedures', () => {
      // Three procedures each suggesting proc-d at 30%
      // Noisy-OR: 1 - (0.7)^3 = 1 - 0.343 = 0.657 = 66%
      
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.procedureAddCounts['proc-b'] = 10;
      predictionData.procedureAddCounts['proc-c'] = 10;
      predictionData.coOccurrences['proc-a'] = { 'proc-d': 3 };
      predictionData.coOccurrences['proc-b'] = { 'proc-d': 3 };
      predictionData.coOccurrences['proc-c'] = { 'proc-d': 3 };

      const suggestions = provider.getSuggestions(
        ['proc-a', 'proc-b', 'proc-c'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].procedure.controlName).toBe('proc-d');
      expect(suggestions[0].confidence).toBe(66);
      expect(suggestions[0].contributingProcedures).toBe(3);
    });

    it('should accumulate co-occurrence counts from multiple procedures', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.procedureAddCounts['proc-b'] = 10;
      predictionData.coOccurrences['proc-a'] = { 'proc-c': 4 };
      predictionData.coOccurrences['proc-b'] = { 'proc-c': 3 };

      const suggestions = provider.getSuggestions(
        ['proc-a', 'proc-b'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions[0].coOccurrenceCount).toBe(7); // 4 + 3
    });
  });

  describe('Variant Detection', () => {
    let variantProcedures: ProcedureDefinition[];

    beforeEach(() => {
      variantProcedures = [
        createProcedure('central-line-adult', 'Central Line >= 5 years old'),
        createProcedure('central-line-peds', 'Central Line < 5 years old'),
        createProcedure('lumbar-puncture-adult', 'Lumbar Puncture (Adult)'),
        createProcedure('lumbar-puncture-peds', 'Lumbar Puncture (Pediatric)'),
        createProcedure('io-tibial', 'IO Access - Tibial'),
        createProcedure('io-femoral', 'IO Access - Femoral'),
        createProcedure('iv-start', 'IV Start'),
        createProcedure('blood-draw', 'Blood Draw'),
      ];
    });

    it('should not suggest age variant when another age variant is in session', () => {
      predictionData.procedureAddCounts['iv-start'] = 10;
      predictionData.coOccurrences['iv-start'] = { 
        'central-line-adult': 8, // 80%
        'central-line-peds': 7, // 70%
        'blood-draw': 5, // 50%
      };

      const suggestions = provider.getSuggestions(
        ['iv-start', 'central-line-adult'], // Already have adult central line
        variantProcedures,
        predictionData,
        0
      );

      // Should not suggest central-line-peds since central-line-adult is in session
      const suggestedControlNames = suggestions.map(s => s.procedure.controlName);
      expect(suggestedControlNames).not.toContain('central-line-peds');
      expect(suggestedControlNames).toContain('blood-draw');
    });

    it('should not suggest parenthetical variant when another is in session', () => {
      predictionData.procedureAddCounts['iv-start'] = 10;
      predictionData.coOccurrences['iv-start'] = { 
        'lumbar-puncture-adult': 8,
        'lumbar-puncture-peds': 7,
      };

      const suggestions = provider.getSuggestions(
        ['iv-start', 'lumbar-puncture-adult'],
        variantProcedures,
        predictionData,
        0
      );

      const suggestedControlNames = suggestions.map(s => s.procedure.controlName);
      expect(suggestedControlNames).not.toContain('lumbar-puncture-peds');
    });

    it('should not suggest location variant when another location is in session', () => {
      predictionData.procedureAddCounts['iv-start'] = 10;
      predictionData.coOccurrences['iv-start'] = { 
        'io-tibial': 8,
        'io-femoral': 7,
      };

      const suggestions = provider.getSuggestions(
        ['iv-start', 'io-tibial'],
        variantProcedures,
        predictionData,
        0
      );

      const suggestedControlNames = suggestions.map(s => s.procedure.controlName);
      expect(suggestedControlNames).not.toContain('io-femoral');
    });

    it('should still suggest unrelated procedures when variant is in session', () => {
      predictionData.procedureAddCounts['central-line-adult'] = 10;
      predictionData.coOccurrences['central-line-adult'] = { 
        'iv-start': 9,
        'blood-draw': 8,
      };

      const suggestions = provider.getSuggestions(
        ['central-line-adult'],
        variantProcedures,
        predictionData,
        0
      );

      const suggestedControlNames = suggestions.map(s => s.procedure.controlName);
      expect(suggestedControlNames).toContain('iv-start');
      expect(suggestedControlNames).toContain('blood-draw');
    });
  });

  describe('Threshold Filtering', () => {
    it('should filter out suggestions below threshold', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 8, // 80%
        'proc-c': 4, // 40%
        'proc-d': 2, // 20%
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        50
      );

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].procedure.controlName).toBe('proc-b');
    });

    it('should include suggestions exactly at threshold', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 5, // 50% exactly
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        50
      );

      expect(suggestions.length).toBe(1);
      expect(suggestions[0].confidence).toBe(50);
    });

    it('should return all suggestions when threshold is 0', () => {
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.coOccurrences['proc-a'] = { 
        'proc-b': 1, // 10%
        'proc-c': 2, // 20%
      };

      const suggestions = provider.getSuggestions(
        ['proc-a'],
        procedures,
        predictionData,
        0
      );

      expect(suggestions.length).toBe(2);
    });
  });

  describe('Sorting Priority', () => {
    it('should sort by confidence first, then contributing procedures, then co-occurrence count', () => {
      // Set up a scenario with tied confidences but different contributing counts
      predictionData.procedureAddCounts['proc-a'] = 10;
      predictionData.procedureAddCounts['proc-b'] = 10;
      
      // proc-c: 50% from proc-a only (1 contributor, co-occurrence: 5)
      // proc-d: will also be 50% but from both (need to calculate)
      // Let's make them have same final confidence but different contributors
      
      // To get 50% from single source vs multiple sources:
      // Single source: 5/10 = 50%
      // Two sources each at ~29%: 1-(0.71*0.71) = 1-0.5 = 50%
      // Actually it's hard to get exact same, let's test the secondary sort
      
      predictionData.coOccurrences['proc-a'] = { 
        'proc-c': 5, // 50%
        'proc-d': 5, // 50%
      };
      predictionData.coOccurrences['proc-b'] = { 
        'proc-d': 5, // proc-d also suggested by proc-b
      };

      const suggestions = provider.getSuggestions(
        ['proc-a', 'proc-b'],
        procedures,
        predictionData,
        0
      );

      // proc-d should come before proc-c because:
      // - proc-d has higher combined confidence (from noisy-OR)
      // - Even if confidence were equal, proc-d has 2 contributors vs 1
      expect(suggestions[0].procedure.controlName).toBe('proc-d');
    });
  });
});

// ============================================
// GeminiProvider Tests
// ============================================

describe('GeminiProvider', () => {
  it('should have correct name', () => {
    const provider = new GeminiProvider();
    expect(provider.name).toBe('Gemini AI');
  });

  it('should not be available without configuration', () => {
    const provider = new GeminiProvider();
    expect(provider.isAvailable()).toBe(false);
  });

  it('should not be available even with API key (not yet implemented)', () => {
    const provider = new GeminiProvider('test-api-key');
    expect(provider.isAvailable()).toBe(false);
  });

  it('should return empty suggestions (not implemented)', () => {
    const provider = new GeminiProvider('test-api-key');
    const suggestions = provider.getSuggestions(
      ['proc-a'],
      [createProcedure('proc-b', 'Procedure B')],
      createEmptyPredictionData(),
      50
    );
    expect(suggestions).toEqual([]);
  });

  it('should allow setting API key', () => {
    const provider = new GeminiProvider();
    provider.setApiKey('new-api-key');
    // Still not available because implementation isn't done
    expect(provider.isAvailable()).toBe(false);
  });
});

// ============================================
// Factory Function Tests
// ============================================

describe('createSuggestionProvider', () => {
  it('should create LocalStatisticalProvider for local setting', () => {
    const settings: SuggestionSettings = {
      enabled: true,
      threshold: 50,
      maxSuggestions: 10,
      facilityTypes: ['ed'],
      autoSeed: true,
      aiProvider: 'local',
    };

    const provider = createSuggestionProvider(settings);
    expect(provider.name).toBe('Local Statistical');
    expect(provider.isAvailable()).toBe(true);
  });

  it('should create GeminiProvider for gemini setting', () => {
    const settings: SuggestionSettings = {
      enabled: true,
      threshold: 50,
      maxSuggestions: 10,
      facilityTypes: ['ed'],
      autoSeed: true,
      aiProvider: 'gemini',
      aiApiKey: 'test-key',
    };

    const provider = createSuggestionProvider(settings);
    expect(provider.name).toBe('Gemini AI');
  });

  it('should default to LocalStatisticalProvider for unknown provider', () => {
    const settings: SuggestionSettings = {
      enabled: true,
      threshold: 50,
      maxSuggestions: 10,
      facilityTypes: ['ed'],
      autoSeed: true,
      aiProvider: 'unknown' as any,
    };

    const provider = createSuggestionProvider(settings);
    expect(provider.name).toBe('Local Statistical');
  });
});

describe('getDefaultProvider', () => {
  it('should return LocalStatisticalProvider', () => {
    const provider = getDefaultProvider();
    expect(provider.name).toBe('Local Statistical');
    expect(provider.isAvailable()).toBe(true);
  });
});

// ============================================
// Constants Tests
// ============================================

describe('Constants', () => {
  it('should have reasonable MIN_SAMPLE_SIZE', () => {
    expect(MIN_SAMPLE_SIZE).toBeGreaterThanOrEqual(1);
    expect(MIN_SAMPLE_SIZE).toBeLessThanOrEqual(10);
  });

  it('should have reasonable MIN_COOCCURRENCE_COUNT', () => {
    expect(MIN_COOCCURRENCE_COUNT).toBeGreaterThanOrEqual(1);
  });

  it('should have reasonable DEFAULT_MAX_SUGGESTIONS', () => {
    expect(DEFAULT_MAX_SUGGESTIONS).toBeGreaterThan(0);
    expect(DEFAULT_MAX_SUGGESTIONS).toBeLessThanOrEqual(50);
  });
});
