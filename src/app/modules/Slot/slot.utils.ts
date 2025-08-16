// Convert HH:mm to total minutes
export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  console.log(h,m)
  return h * 60 + m;
};

// Convert total minutes to HH:mm
export const toTimeString = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Check if two time ranges overlap
export const isOverlap = (
  a: { start: string; end: string },
  b: { start: string; end: string }
): boolean => {
  const aStart = toMinutes(a.start);
  const aEnd = toMinutes(a.end);
  const bStart = toMinutes(b.start);
  const bEnd = toMinutes(b.end);

  return aStart < bEnd && aEnd > bStart;
};

// Check if any of incoming slots overlap with existing ones
export const hasOverlap = (
  existing: { start: string; end: string }[],
  incoming: { start: string; end: string }[]
): boolean => {
  return incoming.some((newSlot) =>
    existing.some((existingSlot) => isOverlap(existingSlot, newSlot))
  );
};

// Remove duplicates based on start-end string key
export const removeDuplicateSlots = (
  slots: { start: string; end: string }[]
): { start: string; end: string }[] => {
  return Array.from(
    new Map(slots.map((slot) => [`${slot.start}-${slot.end}`, slot])).values()
  );
};

// Split a time range into 1-hour chunks
export const splitIntoHourlySlots = (
  start: string,
  end: string
): { start: string; end: string }[] => {
  const result: { start: string; end: string }[] = [];

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  if (startMin >= endMin) return result;

  let current = startMin;
  while (current + 60 <= endMin) {
    result.push({
      start: toTimeString(current),
      end: toTimeString(current + 60),
    });
    current += 60;
  }

  return result;
};
