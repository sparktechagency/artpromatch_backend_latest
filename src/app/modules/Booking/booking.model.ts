import mongoose, { Schema, model } from 'mongoose';
import { IBooking } from './booking.interface';
import { BOOKING_STATUS } from './booking.constant';

const bookingSchema = new Schema<IBooking>(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    slotTimeId: {
      type: mongoose.Schema.Types.ObjectId, // specific subdocument in slots[]
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: 'pending',
    },
    service: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    bodyLocation: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    referralImage: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

const Booking = model<IBooking>('Booking', bookingSchema);
export default Booking;
