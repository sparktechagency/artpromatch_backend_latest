import { AppError } from '../../utils';
import GuestSpot from '../GuestSpot/guestSpot.model';
import { IWeeklySchedule } from '../Schedule/schedule.interface';
import ArtistSchedule from '../Schedule/schedule.model';
import httpStatus from 'http-status';

export const minToTimeString = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const roundUpMinutes = (min: number, step = 15) => {
  return Math.ceil(min / step) * step;
};

export function parseTimeToMinutes(timeStr: string): number {
  const [time, modifier] = timeStr.toLowerCase().split(' '); // e.g. "09:30 am"
  const [hoursRaw, minutesRaw] = time.split(':').map(Number);

  let hours = hoursRaw;
  const minutes = minutesRaw; // ✅ now const

  if (modifier === 'pm' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'am' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export const resolveScheduleForDate = async (artistId: string, date: Date) => {
  const dayName = date
    .toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' })
    .toLowerCase() as keyof IWeeklySchedule;

  const scheduleDoc = await ArtistSchedule.findOne({ artistId }).lean();

  if (!scheduleDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist schedule not found');
  }

  // First check guest spot
  if (scheduleDoc.activeGuestSpot) {
    const guestSpot = await GuestSpot.findById(
      scheduleDoc.activeGuestSpot
    ).lean();
    if (guestSpot?.isActive) {
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const gsStartOnly = new Date(
        guestSpot.startDate.getFullYear(),
        guestSpot.startDate.getMonth(),
        guestSpot.startDate.getDate()
      );
      const gsEndOnly = new Date(
        guestSpot.endDate.getFullYear(),
        guestSpot.endDate.getMonth(),
        guestSpot.endDate.getDate()
      );

      if (dateOnly >= gsStartOnly && dateOnly <= gsEndOnly) {
        return {
          schedule: {
            startTimeinMinute: guestSpot.startTimeinMinute,
            endTimeinMinute: guestSpot.endTimeinMinute,
            off: false,
          },
          offDays: guestSpot.offDays || null,
        };
      }
    }
  }

  // Then check offDays (object)
  if (scheduleDoc.offDays?.startDate && scheduleDoc.offDays?.endDate) {
    const offStart = new Date(scheduleDoc.offDays.startDate);
    const offEnd = new Date(scheduleDoc.offDays.endDate);

    if (date >= offStart && date <= offEnd) {
      return { schedule: { off: true }, offDays: scheduleDoc.offDays };
    }
  }

  // Fallback weekly schedule
  const daySchedule = scheduleDoc.weeklySchedule?.[dayName];
  return {
    schedule: daySchedule || { off: true },
    offDays: scheduleDoc.offDays || null,
  };
};


