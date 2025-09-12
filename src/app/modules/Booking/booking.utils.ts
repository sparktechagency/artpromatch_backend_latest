import GuestSpot from '../GuestSpot/guest.spot.model';
import { WeeklySchedule } from '../Schedule/schedule.interface';
import ArtistSchedule from '../Schedule/schedule.model';

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


export const resolveScheduleForDate = async (artistId: string, date: Date) => {
  const dayName = date
    .toLocaleString("en-US", { weekday: "long", timeZone: "UTC" })
    .toLowerCase() as keyof WeeklySchedule;
   
  console.log(dayName)
  const scheduleDoc = await ArtistSchedule.findOne({ artistId }).lean();
  if (!scheduleDoc) throw new Error("Artist schedule not found");

  // ✅ First check guest spot
  if (scheduleDoc.activeGuestSpot) {
    const guestSpot = await GuestSpot.findById(scheduleDoc.activeGuestSpot).lean();
    if (guestSpot?.isActive) {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
            startMin: guestSpot.startMin,
            endMin: guestSpot.endMin,
            off: false,
          },
          offTime: guestSpot.offTime || null,
        };
      }
    }
  }

  // ✅ Then check offTime (object)
  if (scheduleDoc.offTime?.startDate && scheduleDoc.offTime?.endDate) {
    const offStart = new Date(scheduleDoc.offTime.startDate);
    const offEnd = new Date(scheduleDoc.offTime.endDate);

    if (date >= offStart && date <= offEnd) {
      return { schedule: { off: true }, offTime: scheduleDoc.offTime };
    }
  }

  // ✅ Fallback weekly schedule
  const daySchedule = scheduleDoc.weeklySchedule?.[dayName];
  return { schedule: daySchedule || { off: true }, offTime: scheduleDoc.offTime || null };
};