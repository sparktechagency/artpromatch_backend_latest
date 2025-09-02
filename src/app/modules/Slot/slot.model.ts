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
//   {
//     timestamps: true,
//     versionKey: false,
//   }
// );

// const Slot = model<ISlot>('Slot', slotSchema);

// export default Slot;



const DayScheduleSchema = new mongoose.Schema({
  start: { type: String, default: null },
  end: { type: String, default: null },
  off: { type: Boolean, default: false },
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
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

const ArtistSchedule = model<IArtistSchedule>(
  'ArtistSchedule',
  ArtistScheduleSchema
);
export default ArtistSchedule;
