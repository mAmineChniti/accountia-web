import IntlMessageFormat from 'intl-messageformat';

export function formatICU(
  message: string,
  values: Record<string, string | number>,
  locale = 'en'
): string {
  try {
    const formatter = new IntlMessageFormat(message, locale);
    return formatter.format(values) as string;
  } catch {
    // Fallback to simple replacement if ICU parsing fails
    let result = message;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(`{${key}}`, String(value));
    }
    return result;
  }
}
