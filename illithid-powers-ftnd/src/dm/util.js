export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "A", "A or B", "A, B or C" */
export const orList = (names) =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;

/** "A", "A and B", "A, B and C" */
export const andList = (names) =>
  names.length < 2
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
