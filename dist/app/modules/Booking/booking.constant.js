"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_STATUS = exports.PAYMENT_STATUS = exports.BOOKING_STATUS = void 0;
exports.BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROGRESS: 'in_progress',
    READY_FOR_COMPLETION: 'ready_for_completion',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
};
exports.PAYMENT_STATUS = {
    PENDING: 'pending',
    AUTHORIZED: 'authorized',
    CAPTURED: 'captured',
    SUCCESSED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};
exports.SESSION_STATUS = {
    PENDING: 'pending',
    SCHEDULED: 'scheduled',
    RESCHEDULED: 'rescheduled',
    COMPLETED: 'completed'
};
