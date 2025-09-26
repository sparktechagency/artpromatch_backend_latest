import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SESSION_STATUS,
} from './booking.constant';
import {
  IBooking,
  IPayment,
  IPaymentArtist,
  IPaymentClient,
} from './booking.interface';


export const sessionSchema = new Schema({
  sessionNumber: { type: Number, default: 0 },

  // Store time in minutes for calculations
  startTimeInMin: { type: Number, default: 0 },
  endTimeInMin: { type: Number, default: 0 },

  // Store human-readable time (e.g., "9:00 am")
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  date: { type: Date, default: null },

  status: {
    type: String,
    enum: Object.values(SESSION_STATUS),
    default: 'pending',
  },
});

const PaymentClientSchema = new Schema<IPaymentClient>(
  {
    chargeId: { type: String },
    paymentIntentId: { type: String },
    refundId: { type: String },
  },
  { _id: false }
);

const PaymentArtistSchema = new Schema<IPaymentArtist>(
  {
    transferId: { type: String },
    transactionId: { type: String },
    payoutId: { type: String },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    client: { type: PaymentClientSchema, default: {} },
    artist: { type: PaymentArtistSchema, default: {} },
  },
  { _id: false }
);

// booking schema
const bookingSchema = new Schema<IBooking>(
  {
    artist: {
      type: Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
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
      default: '',
    },

    clientInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    artistInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },

    scheduledDurationInMin: { type: Number, default: 0 },

    sessions: {
      type: [sessionSchema],
      default: [],
    },

    // Booking-level status
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: 'pending',
    },

    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    bodyPart: { type: String, required: true },

    // --- Payment (global) ---

    payment: { type: PaymentSchema, default: {} },
    checkoutSessionId: { type: String },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: 'pending',
    },
    stripeFee: {
      type: Number,
      default: 0,
    },
    platFormFee: {
      type: Number,
      default: 0,
    },
    artistEarning: {
      type: Number,
      default: 0,
    },

    otp: { type: String },
    otpExpiresAt: { type: Date },
    completedAt: { type: Date },
    // If cancelled
    cancelledAt: { type: Date, default: null },
    cancelBy: { type: String, enum: ['ARTIST', 'CLIENT'] },

    // Feedback
    review: { type: String },
    rating: { type: Number, min: 1, max: 5 },

    isInGuestSpot: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ 'clientInfo.fullName': 1 });
bookingSchema.index({ 'clientInfo.email': 1 });
bookingSchema.index({ 'clientInfo.phone': 1 });
bookingSchema.index({ 'artistInfo.fullName': 1 });
bookingSchema.index({ 'artistInfo.email': 1 });
bookingSchema.index({ 'artistInfo.phone': 1 });


bookingSchema.pre('save', async function (next) {
  if (!this.isModified('otp')) return next();

  if (this.otp != null) {
    this.otp = await bcrypt.hash(
      this.otp.toString(),6);
  }

  next();
})


bookingSchema.methods.isOtpMatched = async function (otp: string) {
  console.log(otp,this.otp)
  console.log(await bcrypt.compare(otp, this.otp))
  return await bcrypt.compare(otp, this.otp);
};

const Booking = model<IBooking>('Booking', bookingSchema);
export default Booking;
