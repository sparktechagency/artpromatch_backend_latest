"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTimeToMinutes = convertTimeToMinutes;
/**
 * Convert time string like "10 am", "9:30 pm" into minutes from midnight
 * Example: "10 am" -> 600, "9:30 pm" -> 21*60 + 30 = 1290
 */
function convertTimeToMinutes(timeStr) {
    // "10 am" or "9:30 pm"
    const [time, meridian] = timeStr.toLowerCase().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (!minutes)
        minutes = 0;
    if (meridian === 'pm' && hours !== 12) {
        hours += 12;
    }
    if (meridian === 'am' && hours === 12) {
        hours = 0;
    }
    return hours * 60 + minutes;
}
