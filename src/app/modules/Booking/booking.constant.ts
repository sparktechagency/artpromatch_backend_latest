export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
  } as const;
  
  export const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESSED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  } as const

  export type TPaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
  export type TBookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
  