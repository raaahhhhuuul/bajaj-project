const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

export function validateEntries(data) {
  const validEdges = [];
  const invalidEntries = [];
  const entries = Array.isArray(data) ? data : [];

  for (const entry of entries) {
    if (typeof entry !== "string") {
      invalidEntries.push(entry);
      continue;
    }

    const trimmedEntry = entry.trim();

    if (!trimmedEntry) {
      invalidEntries.push(entry);
      continue;
    }

    const match = trimmedEntry.match(EDGE_PATTERN);

    if (!match) {
      invalidEntries.push(entry);
      continue;
    }

    const [, parent, child] = match;

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    validEdges.push({
      parent,
      child,
      edge: `${parent}->${child}`,
    });
  }

  return { validEdges, invalidEntries };
}
