/**
 * Normalizes text by trimming, collapsing whitespace, and lowercasing.
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Extracts the assistant message from model output.
 * Looks for common patterns like "Assistant:", "AI:", or the last
 * message in a conversation-style output.
 */
export function extractAssistantMessage(output: string): string {
  if (!output || typeof output !== 'string') {
    return '';
  }

  // Try to match "Assistant: ..." or "AI: ..." pattern
  const assistantMatch = output.match(
    /(?:assistant|ai)\s*:\s*([\s\S]*?)(?=(?:user|human)\s*:|$)/i,
  );
  if (assistantMatch) {
    return assistantMatch[1].trim();
  }

  // If no pattern found, return the trimmed output as-is
  return output.trim();
}
