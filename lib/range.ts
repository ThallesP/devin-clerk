export function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | "invalid" | null {
  if (header == null || header.trim() === "") {
    return null;
  }

  const match = /^bytes=\s*(\d*)\s*-\s*(\d*)\s*$/i.exec(header.trim());
  if (!match) {
    return "invalid";
  }

  const [, startStr, endStr] = match;
  if (startStr === "" && endStr === "") {
    return "invalid";
  }

  if (startStr === "") {
    const suffix = Number(endStr);
    if (!Number.isSafeInteger(suffix) || suffix === 0 || size === 0) {
      return "invalid";
    }
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }

  const start = Number(startStr);
  if (!Number.isSafeInteger(start)) {
    return "invalid";
  }

  if (endStr === "") {
    if (start >= size) {
      return "invalid";
    }
    return { start, end: size - 1 };
  }

  const end = Number(endStr);
  if (!Number.isSafeInteger(end) || start > end || start >= size) {
    return "invalid";
  }

  return { start, end: Math.min(end, size - 1) };
}
