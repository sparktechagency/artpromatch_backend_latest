import { Schema, model } from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from './booking.constant';
import { IBooking } from './booking.interface';

const bookingSchema = new Schema<IBooking>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },

    originalDate: {
      type: Date,
      required: true,
      default: null,
    },
    // day: {
    //   type: String,
    //   required: true,
    // },
    startTimeinMinute: {
      type: Number,
      required: true,
    },
    endTimeinMinute: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: 'confirmed',
    },

    serviceName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    serviceLocation: {
      type: String,
      required: true,
    },
    bodyPart: {
      type: String,
      required: true,
    },

    paymentIntentId: {
      type: String,
      required: true,
    },
    chargeId: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: 'pending',
    },

    review: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      required: true,
    },

    isInGuestSpot: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const Booking = model<IBooking>('Booking', bookingSchema);
export default Booking;
