// Default tokens (used when only one adapter is registered per type)
export const LLM_ADAPTER = 'LLM_ADAPTER';
export const TTS_ADAPTER = 'TTS_ADAPTER';
export const STT_ADAPTER = 'STT_ADAPTER';
export const REALTIME_ADAPTER = 'REALTIME_ADAPTER';

/**
 * Generate a named injection token for a specific adapter instance.
 * Usage: @Inject(namedToken('LLM', 'gemini-flash'))
 */
export function namedToken(type: 'LLM' | 'TTS' | 'STT' | 'REALTIME', name: string): string {
  return `${type}_${name}`;
}
