import mongoose, { Schema, model } from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from './booking.constant';
import { IBooking } from './booking.interface';

const bookingSchema = new Schema<IBooking>(
  {
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
     client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalDate: {
      type: Date,
      required: true,
      default: null
    },
    day: {
      type: String,
      required: true,
    },
    startMin: {
       type: Number,
      required: true,
    },
     endMin: {
       type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: 'pending',
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    chargeId: {
      type: String,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: 'confirmed',
    },
    bookingPrice: {
      type: Number,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    bodyLocation: {
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
