export const BOOKING_STATUS = {
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled'
  } as const;
  
  export const PAYMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  }

  export type TPaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
  export type TBookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
  