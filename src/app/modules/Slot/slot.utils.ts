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



// parsed slots

import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek"; 
import { DaySchedule, WeeklySchedule } from "./slot.interface";
dayjs.extend(isoWeek);

// Map Mon–Sun → numeric weekday (ISO: 1 = Monday, 7 = Sunday)
const weekdayMap: Record<string, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7
};

export function parseSlotTime(day: string, time?: string): Date {
  if (!time) throw new Error("Time is undefined");

  const parts = time.trim().split(" ");
  if (parts.length !== 2) throw new Error(`Invalid time format: ${time}`);

  const [t, modifier] = parts;
  const [hoursStr, minutesStr] = t.split(":");
  if (!hoursStr || !minutesStr) throw new Error(`Invalid time format: ${time}`);

  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (isNaN(hours) || isNaN(minutes)) throw new Error(`Invalid numeric values in time: ${time}`);

  // start from beginning of this ISO week
  let base = dayjs().startOf("week").add(weekdayMap[day] - 1, "day");

  // apply hours/minutes with AM/PM
  let h = hours % 12; // 12-hour base
  if (modifier.toLowerCase() === "pm") h += 12;

  return base.hour(h).minute(minutes).second(0).millisecond(0).toDate();
}


const defaultDaySchedule = (): DaySchedule => ({
  start: null,
  end: null,
  off: true,
});


export const normalizeWeeklySchedule = (
  input: Partial<WeeklySchedule>
): WeeklySchedule => {
  const days: (keyof WeeklySchedule)[] = [
    "monday","tuesday","wednesday","thursday","friday","saturday","sunday"
  ];

  const normalized: WeeklySchedule = {} as WeeklySchedule;

  for (const day of days) {
    const schedule = input[day];

    if (!schedule || schedule.off) {
      normalized[day] = defaultDaySchedule();
    } else {
      normalized[day] = {
        start: schedule.start ?? null,
        end: schedule.end ?? null,
        off: false,
      };
    }
  }

  return normalized;
};