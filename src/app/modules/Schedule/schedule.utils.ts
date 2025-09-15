import { IDaySchedule, IWeeklySchedule } from './schedule.interface';

// Convert HH:mm to total minutes
export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
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

// format day

export const formatDay = (day: IDaySchedule) => ({
  startTime: day.startTime,
  endTime: day.endTime,
  off: day.off,
});

// Split a time range into 1-hour chunks
export const splitIntoHourlySlots = (
  start: string,
  end: string
): { start: string; end: string }[] => {
  const result: { start: string; end: string }[] = [];

  const startTimeinMinute = toMinutes(start);
  const endTimeinMinute = toMinutes(end);

  if (startTimeinMinute >= endTimeinMinute) return result;

  let current = startTimeinMinute;
  while (current + 60 <= endTimeinMinute) {
    result.push({
      start: toTimeString(current),
      end: toTimeString(current + 60),
    });
    current += 60;
  }

  return result;
};

// parsed slots

function timeToMinutes(timeStr: string) {
  // normalize input like "8:00 am" -> ["8:00", "am"]
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3].toLowerCase();

  if (modifier === 'pm' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'am' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

const defaultDaySchedule = (): IDaySchedule => ({
  startTime: null,
  endTime: null,
  startTimeinMinute: null,
  endTimeinMinute: null,
  off: true,
});

export const normalizeWeeklySchedule = (
  input: Partial<IWeeklySchedule>,
  existing?: IWeeklySchedule
): IWeeklySchedule => {
  const days: (keyof IWeeklySchedule)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const normalized: IWeeklySchedule = {} as IWeeklySchedule;

  for (const day of days) {
    const incoming = input[day];
    const prev = existing?.[day];

    if (!incoming) {
      // keep existing day if available, otherwise default
      normalized[day] = prev ?? defaultDaySchedule();
      continue;
    }

    if (incoming.off) {
      normalized[day] = defaultDaySchedule();
    } else {
      normalized[day] = {
        startTime: incoming.startTime ?? prev?.startTime ?? null,
        endTime: incoming.endTime ?? prev?.endTime ?? null,
        startTimeinMinute: incoming.startTime
          ? timeToMinutes(incoming.startTime)
          : prev?.startTimeinMinute ?? null,
        endTimeinMinute: incoming.endTime
          ? timeToMinutes(incoming.endTime)
          : prev?.endTimeinMinute ?? null,
        off: false,
      };
    }
  }

  return normalized;
};
