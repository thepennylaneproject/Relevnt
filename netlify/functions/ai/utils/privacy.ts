/**
 * PRIVACY UTILITY
 * 
 * Detects and strips Personally Identifiable Information (PII)
 * before sending data to AI providers.
 * 
 * Protects: emails, phones, SSNs, addresses, credit cards, etc.
 */

interface PIIDetectionResult {
  hasPII: boolean;
  types: string[];
  locations: Array<{ type: string; match: string; start: number; end: number }>;
}

// PII Detection Patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  zipCode: /\b\d{5}(-\d{4})?\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
};

// Replacement strategies
const REPLACEMENTS: Record<string, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  ssn: '[SSN]',
  creditCard: '[CREDIT_CARD]',
  zipCode: '[ZIP]',
  ipAddress: '[IP]',
  url: '[URL]',
};

/**
 * Detect PII in text
 */
export function detectPII(text: string): PIIDetectionResult {
  const locations: Array<{ type: string; match: string; start: number; end: number }> = [];
  const types = new Set<string>();

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        locations.push({
          type,
          match: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
        types.add(type);
      }
    }
  }

  return {
    hasPII: locations.length > 0,
    types: Array.from(types),
    locations: locations.sort((a, b) => a.start - b.start),
  };
}

/**
 * Strip PII from text
 */
export function stripPIIFromText(text: string): string {
  let cleanedText = text;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    cleanedText = cleanedText.replace(pattern, REPLACEMENTS[type]);
  }

  return cleanedText;
}

/**
 * Strip PII from any input (string, object, array)
 */
export async function stripPII(input: any): Promise<any> {
  if (typeof input === 'string') {
    return stripPIIFromText(input);
  }

  if (Array.isArray(input)) {
    return Promise.all(input.map(item => stripPII(item)));
  }

  if (typeof input === 'object' && input !== null) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(input)) {
      cleaned[key] = await stripPII(value);
    }
    return cleaned;
  }

  return input;
}

/**
 * Check if text contains sensitive PII
 * (SSN, Credit Card, etc. - higher risk than email/phone)
 */
export function hasSensitivePII(text: string): boolean {
  const sensitive = ['ssn', 'creditCard'];
  const detection = detectPII(text);
  return detection.types.some(type => sensitive.includes(type));
}

/**
 * Redact specific fields in an object
 */
export function redactFields(obj: any, fields: string[]): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted = { ...obj };
  
  for (const field of fields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
}
