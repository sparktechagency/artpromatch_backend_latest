"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWeeklySchedule = exports.splitIntoHourlySlots = exports.formatDay = exports.removeDuplicateSlots = exports.hasOverlap = exports.isOverlap = exports.toTimeString = exports.toMinutes = void 0;
// Convert HH:mm to total minutes
const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};
exports.toMinutes = toMinutes;
// Convert total minutes to HH:mm
const toTimeString = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
exports.toTimeString = toTimeString;
// Check if two time ranges overlap
const isOverlap = (a, b) => {
    const aStart = (0, exports.toMinutes)(a.start);
    const aEnd = (0, exports.toMinutes)(a.end);
    const bStart = (0, exports.toMinutes)(b.start);
    const bEnd = (0, exports.toMinutes)(b.end);
    return aStart < bEnd && aEnd > bStart;
};
exports.isOverlap = isOverlap;
// Check if any of incoming slots overlap with existing ones
const hasOverlap = (existing, incoming) => {
    return incoming.some((newSlot) => existing.some((existingSlot) => (0, exports.isOverlap)(existingSlot, newSlot)));
};
exports.hasOverlap = hasOverlap;
// Remove duplicates based on start-end string key
const removeDuplicateSlots = (slots) => {
    return Array.from(new Map(slots.map((slot) => [`${slot.start}-${slot.end}`, slot])).values());
};
exports.removeDuplicateSlots = removeDuplicateSlots;
// format day
const formatDay = (day) => ({
    startTime: day.startTime,
    endTime: day.endTime,
    off: day.off,
});
exports.formatDay = formatDay;
// Split a time range into 1-hour chunks
const splitIntoHourlySlots = (start, end) => {
    const result = [];
    const startTimeinMinute = (0, exports.toMinutes)(start);
    const endTimeinMinute = (0, exports.toMinutes)(end);
    if (startTimeinMinute >= endTimeinMinute)
        return result;
    let current = startTimeinMinute;
    while (current + 60 <= endTimeinMinute) {
        result.push({
            start: (0, exports.toTimeString)(current),
            end: (0, exports.toTimeString)(current + 60),
        });
        current += 60;
    }
    return result;
};
exports.splitIntoHourlySlots = splitIntoHourlySlots;
// parsed slots
function timeToMinutes(timeStr) {
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
const defaultDaySchedule = () => ({
    startTime: null,
    endTime: null,
    startTimeinMinute: null,
    endTimeinMinute: null,
    off: true,
});
const normalizeWeeklySchedule = (input, existing) => {
    const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
    ];
    const normalized = {};
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
        }
        else {
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
exports.normalizeWeeklySchedule = normalizeWeeklySchedule;
