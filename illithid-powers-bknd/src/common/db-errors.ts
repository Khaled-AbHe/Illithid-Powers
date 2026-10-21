/**
 * Whether a database error is a UNIQUE constraint violation. Drizzle wraps the
 * driver's error, so SQLite's message is on `cause`, not on the error itself.
 */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { message?: string; cause?: { message?: string } } | null;
  return /UNIQUE constraint failed/i.test(`${e?.cause?.message ?? ""} ${e?.message ?? ""}`);
}
