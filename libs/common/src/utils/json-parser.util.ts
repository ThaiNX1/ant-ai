/**
 * Extracts and parses JSON from model output text.
 * Handles cases where JSON is wrapped in markdown code blocks,
 * or surrounded by other text.
 */
export function parseJsonFromModelOutput(
  raw: string,
): Record<string, unknown> {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Try to extract JSON from markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Fall through to other strategies
    }
  }

  // Try to find a JSON object or array in the text
  const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // Fall through
    }
  }

  // Try parsing the entire string as JSON
  try {
    return JSON.parse(raw.trim());
  } catch {
    throw new Error('Could not extract valid JSON from model output');
  }
}
