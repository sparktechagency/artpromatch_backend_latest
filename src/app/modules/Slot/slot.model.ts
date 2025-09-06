import mongoose, { Schema, model } from 'mongoose';
import { IArtistSchedule } from './slot.interface';
// import { WEEK_DAYS } from '../Artist/artist.constant';
// import { ISlot } from './slot.interface';

// const availabilitySlotSchema = new Schema({
//   start: { type: String, required: true }, // Format: 'HH:MM'
//   end: { type: String, required: true }, // Format: 'HH:MM'
// });

// const slotSchema = new Schema<ISlot>(
//   {
//     auth: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Auth',
//       required: true,
//     },
//     day: {
//       type: String,
//       enum: WEEK_DAYS,
//       required: true,
//     },
//     slots: {
//       type: [availabilitySlotSchema],
//       required: true,
//     },
//   },
// { timestamps: true, versionKey: false }
// );

// const Slot = model<ISlot>('Slot', slotSchema);

// export default Slot;

const DayScheduleSchema = new mongoose.Schema({
  startTime: { type: String, default: null },
  endTime: { type: String, default: null },
  startMin: { type: Number, default: null },
  endMin: { type: Number, default: null },
  off: { type: Boolean, default: true },
});

const GuestSpotSchema = new mongoose.Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  startMin: { type: Number, required: false },
  endMin: { type: Number, required: false },
});

const OffTimeSchema = new mongoose.Schema({
  startDate: { type: Date, required: true, default: null },
  endDate: { type: Date, required: true, default: null },
});

const ArtistScheduleSchema = new mongoose.Schema<IArtistSchedule>(
  {
    artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    weeklySchedule: {
      monday: { type: DayScheduleSchema, required: false },
      tuesday: { type: DayScheduleSchema, required: false },
      wednesday: { type: DayScheduleSchema, required: false },
      thursday: { type: DayScheduleSchema, required: false },
      friday: { type: DayScheduleSchema, required: false },
      saturday: { type: DayScheduleSchema, required: false },
      sunday: { type: DayScheduleSchema, required: false },
    },
    guestSpots: [GuestSpotSchema],
    offTimes: [OffTimeSchema],
  },
  { timestamps: true, versionKey: false }
);

const ArtistSchedule = model<IArtistSchedule>(
  'ArtistSchedule',
  ArtistScheduleSchema
);
export default ArtistSchedule;

/*

// function formatMinutesToTime(minutes) {
//   const hours = Math.floor(minutes / 60);
//   const mins = minutes % 60;
//   const ampm = hours >= 12 ? 'PM' : 'AM';
//   const displayHour = hours % 12 || 12; // 0 → 12
//   console.log(displayHour)
//   return `${displayHour}:${String(mins).padStart(2, '0')} ${ampm}`;
// }

// function formatSlot(start, end) {
//   return `${formatMinutesToTime(start)} - ${formatMinutesToTime(end)}`;
// }

// console.log(formatSlot(0, 580)); 


function timeToMinutes(timeStr) {
  const [time, modifier] = timeStr.split(/(AM|PM)/i); // split into "9:00" and "AM"
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + (minutes || 0);
}

function rangeToMinutes(rangeStr) {
  const [startStr, endStr] = rangeStr.split(" - ").map(s => s.trim());
  return {
    start: timeToMinutes(startStr),
    end: timeToMinutes(endStr)
  };
}

// Example:
console.log(rangeToMinutes("1:00 AM - 12:00 PM"));


*/
