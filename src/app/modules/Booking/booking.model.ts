import { Schema, model } from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from './booking.constant';
import { IBooking } from './booking.interface';


export const sessionSchema = new Schema(
  {
    sessionNumber: { type: Number, default: 0},
    startMin: { type: Number, default: 0 },    
    endMin: { type: Number, default: 0 },        
    date: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending",
    },
  }
);


const bookingSchema = new Schema<IBooking>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
      required: true,
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },

    // Client preferred date range
    preferredDate: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
   
    demoImage: {
      type: String,
      default: ""
    },
    // Sessions array (subdocument schema)
    sessions: [sessionSchema],

    // Booking-level status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: "pending",
    },

    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    bodyPart: { type: String, required: true },

    // --- Payment (global) ---
    paymentIntentId: { type: String },

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: "pending",
    },

    // If cancelled
    cancelledAt: { type: Date, default: null },

    // Feedback
    review: { type: String },
    rating: { type: Number, min: 1, max: 5 },

    isInGuestSpot: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);


const Booking = model<IBooking>('Booking', bookingSchema);
export default Booking;
