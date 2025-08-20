import mongoose, { Schema, model } from 'mongoose';
import { IArtistSchedule, ISlot } from './slot.interface';
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

const SlotSchema = new Schema<ISlot>(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const ArtistScheduleSchema = new Schema<IArtistSchedule>(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },

    mon: [SlotSchema],
    tue: [SlotSchema],
    wed: [SlotSchema],
    thu: [SlotSchema],
    fri: [SlotSchema],
    sat: [SlotSchema],
    sun: [SlotSchema],
  },
  { timestamps: true , versionKey: false}
  
);

const ArtistSchedule = model<IArtistSchedule>(
  'ArtistSchedule',
  ArtistScheduleSchema
);
export default ArtistSchedule;
