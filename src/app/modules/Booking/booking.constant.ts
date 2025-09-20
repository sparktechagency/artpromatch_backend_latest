export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROGRESS: 'in_progress',
    READY_FOR_COMPLETION: 'ready_for_completion',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  } as const;
  
  export const PAYMENT_STATUS = {
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    SUCCESSED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  } as const

export const SESSION_STATUS = {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    RESCHEDULED: 'rescheduled',
    COMPLETED: 'completed'
  } as const

  export type TPaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
  export type TBookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];
  export type TSessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];
  