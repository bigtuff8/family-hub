/**
 * String utility functions
 * Location: frontend/src/utils/strings.ts
 */

/**
 * Get initials from a name (first letter of each word, max 2 chars)
 * Examples:
 *   "James Brown" -> "JB"
 *   "James" -> "J"
 *   "Mary Jane Watson" -> "MJ"
 *   "" -> "?"
 *
 * @param name - Full name string
 * @returns Uppercase initials (1-2 characters)
 */
export const getInitials = (name: string | undefined | null): string => {
  if (!name || name.trim() === '') {
    return '?';
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    // Single name - return first character only
    return parts[0].charAt(0).toUpperCase();
  }

  // Multiple words - take first char of first and last word
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);

  return (firstInitial + lastInitial).toUpperCase();
};
