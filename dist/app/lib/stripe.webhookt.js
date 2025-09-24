"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookHandler = void 0;
const http_status_1 = __importDefault(require("http-status"));
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../config/logger"));
const artistPreferences_model_1 = __importDefault(require("../modules/ArtistPreferences/artistPreferences.model"));
// import { IAuth } from '../modules/Auth/auth.interface';
const auth_model_1 = require("../modules/Auth/auth.model");
const booking_constant_1 = require("../modules/Booking/booking.constant");
const booking_model_1 = __importDefault(require("../modules/Booking/booking.model"));
const notification_constant_1 = require("../modules/notification/notification.constant");
const notification_utils_1 = require("../modules/notification/notification.utils");
const utils_1 = require("../utils");
const boost_profile_model_1 = require("../modules/BoostProfile/boost.profile.model");
const artist_model_1 = __importDefault(require("../modules/Artist/artist.model"));
const stripe = new stripe_1.default(config_1.default.stripe.stripe_secret_key);
exports.stripeWebhookHandler = (0, utils_1.asyncHandler)(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.stripe_webhook_secret;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        if (err instanceof Error) {
            throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, err.message);
        }
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid webhook signature');
    }
    switch (event.type) {
        // case 'checkout.session.completed': {
        //   const session = event.data.object as Stripe.Checkout.Session;
        //   const bookingId = session.metadata?.bookingId;
        //   const userId = session.metadata?.userId ?? '';
        //   const paymentIntentId = session.payment_intent as string;
        //   console.log('checkout session completed',bookingId,userId);
        //   const booking = await Booking.findById(bookingId).select(
        //     'artistInfo clientInfo client artist serviceName'
        //   );
        //   if (!booking)
        //     logger.warn('booking not found', { userId, bookingId });
        //   await Booking.updateOne(
        //     { _id: bookingId },
        //     {
        //       $set: {
        //         'payment.client.paymentIntentId': paymentIntentId,
        //         paymentStatus: PAYMENT_STATUS.AUTHORIZED,
        //       },
        //     },
        //     { runValidators: true }
        //   );
        //   const artist = await ArtistPreferences.findOne(
        //     { artistId: booking.artist },
        //     'notificationChannels'
        //   );
        //   const user = await Auth.findOne({ _id: userId }, 'fcmToken');
        //    logger.warn('User not found', { userId, bookingId });
        //   if (artist?.notificationChannels.includes('app')) {
        //     sendNotificationBySocket({
        //       title: 'New Booking Request',
        //       message: `you have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
        //       receiver: booking.artist.toString() ?? '',
        //       type: NOTIFICATION_TYPE.BOOKING_REQUEST,
        //     });
        //   }
        //   if (artist?.notificationChannels.includes('email')) {
        //     sendNotificationByEmail(
        //       booking.artistInfo.email,
        //       NOTIFICATION_TYPE.BOOKING_REQUEST,
        //       {
        //         fullName: booking.clientInfo.fullName,
        //         serviceName: booking.serviceName,
        //       }
        //     );
        //   }
        //   const date = new Date();
        //   const formatted = date.toLocaleDateString('en-GB', {
        //     day: '2-digit',
        //     month: 'short',
        //     year: 'numeric',
        //   });
        //   if (artist?.notificationChannels.includes('sms')) {
        //     if (user.fcmToken) {
        //       sendPushNotification(user.fcmToken, {
        //         title: 'New Booking Request',
        //         content: `you have a new booking request from ${booking.clientInfo.fullName} for${booking.serviceName}. Please review and confirm.`,
        //         time: formatted,
        //       });
        //     }
        //   }
        //   break;
        // }
        case 'checkout.session.completed': {
            const session = event.data.object;
            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id;
            const artistId = session.metadata?.artistId ?? '';
            try {
                const boostId = session.metadata?.boostId;
                if (boostId) {
                    console.log(boostId);
                    await boost_profile_model_1.ArtistBoost.findOneAndUpdate({ _id: boostId }, { paymentStatus: 'succeeded', isActive: true, paymentIntentId: paymentIntentId }, { new: true });
                    // also update artist.boost
                    await artist_model_1.default.findByIdAndUpdate(artistId, {
                        boost: {
                            lastBoostAt: new Date(),
                            endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
                            isActive: true,
                        },
                    });
                    break;
                }
                const bookingId = session.metadata?.bookingId;
                const userId = session.metadata?.userId ?? '';
                if (!bookingId) {
                    logger_1.default.warn('Checkout session missing bookingId in metadata', {
                        sessionId: session.id,
                        event: event.type,
                    });
                    break;
                }
                logger_1.default.info('Checkout session completed', {
                    bookingId,
                    userId,
                    sessionId: session.id,
                    event: event.type,
                });
                const booking = await booking_model_1.default.findById(bookingId).select('artistInfo clientInfo client artist serviceName');
                if (!booking) {
                    logger_1.default.error('Booking not found', { bookingId });
                    break;
                }
                await booking_model_1.default.updateOne({ _id: bookingId }, {
                    $set: {
                        'payment.client.paymentIntentId': paymentIntentId,
                        paymentStatus: booking_constant_1.PAYMENT_STATUS.AUTHORIZED,
                    },
                }, { runValidators: true });
                const artist = await artistPreferences_model_1.default.findOne({ artistId: booking.artist }, 'notificationChannels');
                const user = await auth_model_1.Auth.findById(userId, 'fcmToken');
                if (!user) {
                    logger_1.default.warn('User not found for booking', { bookingId, userId });
                }
                // Notifications
                if (artist?.notificationChannels.includes('app')) {
                    try {
                        await (0, notification_utils_1.sendNotificationBySocket)({
                            title: 'New Booking Request',
                            message: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
                            receiver: booking.artist.toString() ?? '',
                            type: notification_constant_1.NOTIFICATION_TYPE.BOOKING_REQUEST,
                        });
                        logger_1.default.info('App notification sent', {
                            bookingId,
                            artistId: booking.artist,
                        });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to send app notification', {
                            error: err,
                            bookingId,
                        });
                    }
                }
                if (artist?.notificationChannels.includes('email')) {
                    try {
                        await (0, notification_utils_1.sendNotificationByEmail)(booking.artistInfo.email, notification_constant_1.NOTIFICATION_TYPE.BOOKING_REQUEST, {
                            fullName: booking.clientInfo.fullName,
                            serviceName: booking.serviceName,
                        });
                        logger_1.default.info('Email notification sent', {
                            bookingId,
                            artistId: booking.artist,
                        });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to send email notification', {
                            error: err,
                            bookingId,
                        });
                    }
                }
                if (artist?.notificationChannels.includes('sms') && user?.fcmToken) {
                    try {
                        const formattedDate = new Date().toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        });
                        await (0, notification_utils_1.sendPushNotification)(user.fcmToken, {
                            title: 'New Booking Request',
                            content: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
                            time: formattedDate,
                        });
                        logger_1.default.info('Push notification sent', { bookingId, userId });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to send push notification', {
                            error: err,
                            bookingId,
                            userId,
                        });
                    }
                }
            }
            catch (err) {
                logger_1.default.error('Webhook handler failed for checkout.session.completed', {
                    error: err,
                    sessionId: session.id,
                    bookingId: session.metadata?.bookingId,
                });
            }
            break;
        }
        // payment failed
        case 'payment_intent.payment_failed': {
            const intent = event.data.object;
            const bookingId = intent.metadata.bookingId;
            await booking_model_1.default.findByIdAndUpdate(bookingId, {
                status: 'pending',
                paymentStatus: 'failed',
            });
            break;
        }
        // charge refund
        case 'charge.refunded': {
            const charge = event.data.object;
            // Update booking to refunded
            await booking_model_1.default.updateOne({ paymentIntentId: charge.payment_intent }, { $set: { status: 'cancelled', paymentStatus: 'refunded' } });
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    res.status(200).json({ received: true });
});
