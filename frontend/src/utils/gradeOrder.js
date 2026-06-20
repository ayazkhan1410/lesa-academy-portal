/** Canonical class order used across the academy system */
export const GRADE_ORDER = [
  'Nursery', 'Prep',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];

/** Extract grade key from API label e.g. "class 10" → "10", "class Nursery" → "Nursery" */
export function parseGradeKey(gradeLabel) {
  return String(gradeLabel ?? '')
    .replace(/^class\s+/i, '')
    .trim();
}

export function getGradeSortIndex(gradeLabel) {
  const key = parseGradeKey(gradeLabel);
  const idx = GRADE_ORDER.findIndex(
    (g) => g.toLowerCase() === key.toLowerCase()
  );
  return idx === -1 ? GRADE_ORDER.length : idx;
}

export function sortByGradeOrder(items, gradeField = 'grade') {
  return [...items].sort(
    (a, b) => getGradeSortIndex(a[gradeField]) - getGradeSortIndex(b[gradeField])
  );
}
