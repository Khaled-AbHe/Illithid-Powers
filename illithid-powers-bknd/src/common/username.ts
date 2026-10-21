/**
 * What counts as a valid player name, and how names are compared.
 *
 * Allowed: letters of any language (accents are fine), numbers, and . - _ '
 * with single spaces between words. No leading, trailing or double spaces, at
 * least one letter or number, and no control characters, emoji or invisible
 * characters.
 */
export const USERNAME_MAX = 64;

const WORD = "[\\p{L}\\p{N}_.'-][\\p{L}\\p{M}\\p{N}_.'-]*"; // a combining accent can follow, never lead
export const USERNAME_PATTERN = new RegExp(`^(?=.*[\\p{L}\\p{N}])${WORD}(?: ${WORD})*$`, "u");
export const USERNAME_MESSAGE =
  "username must be 1-64 characters: letters (accents are fine), numbers, spaces between words, and . - _ '";

/**
 * One canonical form, so the same name typed different ways is the same name:
 * accents composed (e + combining diaeresis becomes ë), the curly apostrophe
 * straightened, and stray spaces trimmed or collapsed.
 */
export function normalizeUsername(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value.normalize("NFC").replaceAll("\u2019", "'").trim().replace(/ {2,}/g, " ");
}

/**
 * Key for "is this name taken?", ignoring capitals. SQLite's lower() only folds
 * plain ASCII (ZOË would not match Zoë), so names are compared here instead.
 */
export const foldUsername = (name: string): string =>
  (normalizeUsername(name) as string).toLowerCase();
