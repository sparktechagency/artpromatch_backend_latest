/* eslint-disable no-console */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
import logger from '../config/logger';
import ArtistPreferences from '../modules/ArtistPreferences/artistPreferences.model';
import { IAuth } from '../modules/Auth/auth.interface';
import { Auth } from '../modules/Auth/auth.model';
import { PAYMENT_STATUS } from '../modules/Booking/booking.constant';
import Booking from '../modules/Booking/booking.model';
import Client from '../modules/Client/client.model';
import ClientPreferences from '../modules/ClientPreferences/clientPreferences.model';
import { NOTIFICATION_TYPE } from '../modules/notification/notification.constant';
import {
  sendNotificationByEmail,
  sendNotificationBySocket,
  sendPushNotification,
} from '../modules/notification/notification.utils';
import { AppError, asyncHandler } from '../utils';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

export const stripeWebhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.stripe_webhook_secret as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret as string
      );
      console.log('Stripe webhook event:', event.type);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new AppError(httpStatus.BAD_REQUEST, err.message);
      }
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid webhook signature');
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
        const session = event.data.object as Stripe.Checkout.Session;

        try {
          const bookingId = session.metadata?.bookingId;
          const userId = session.metadata?.userId ?? '';
          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id;

          if (!bookingId) {
            logger.warn('Checkout session missing bookingId in metadata', {
              sessionId: session.id,
              event: event.type,
            });
            break;
          }

          logger.info('Checkout session completed', {
            bookingId,
            userId,
            sessionId: session.id,
            event: event.type,
          });

          const booking = await Booking.findById(bookingId).select(
            'artistInfo clientInfo client artist serviceName'
          );
          if (!booking) {
            logger.error('Booking not found', { bookingId });
            break;
          }

          await Booking.updateOne(
            { _id: bookingId },
            {
              $set: {
                'payment.client.paymentIntentId': paymentIntentId,
                paymentStatus: PAYMENT_STATUS.AUTHORIZED,
              },
            },
            { runValidators: true }
          );

          const artist = await ArtistPreferences.findOne(
            { artistId: booking.artist },
            'notificationChannels'
          );
          const user = await Auth.findById(userId, 'fcmToken');

          if (!user) {
            logger.warn('User not found for booking', { bookingId, userId });
          }

          // Notifications
          if (artist?.notificationChannels.includes('app')) {
            try {
              await sendNotificationBySocket({
                title: 'New Booking Request',
                message: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
                receiver: booking.artist.toString() ?? '',
                type: NOTIFICATION_TYPE.BOOKING_REQUEST,
              });
              logger.info('App notification sent', {
                bookingId,
                artistId: booking.artist,
              });
            } catch (err) {
              logger.error('Failed to send app notification', {
                error: err,
                bookingId,
              });
            }
          }

          if (artist?.notificationChannels.includes('email')) {
            try {
              await sendNotificationByEmail(
                booking.artistInfo.email,
                NOTIFICATION_TYPE.BOOKING_REQUEST,
                {
                  fullName: booking.clientInfo.fullName,
                  serviceName: booking.serviceName,
                }
              );
              logger.info('Email notification sent', {
                bookingId,
                artistId: booking.artist,
              });
            } catch (err) {
              logger.error('Failed to send email notification', {
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
              await sendPushNotification(user.fcmToken, {
                title: 'New Booking Request',
                content: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
                time: formattedDate,
              });
              logger.info('Push notification sent', { bookingId, userId });
            } catch (err) {
              logger.error('Failed to send push notification', {
                error: err,
                bookingId,
                userId,
              });
            }
          }
        } catch (err) {
          logger.error(
            'Webhook handler failed for checkout.session.completed',
            {
              error: err,
              sessionId: session.id,
              bookingId: session.metadata?.bookingId,
            }
          );
        }

        break;
      }

      // payment intent succeed
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        // console.log('pi', pi);
        if (pi.status !== 'succeeded') {
          logger.error('payment capture failed');
        }

        const booking = await Booking.findOne({
          'payment.client.paymentIntentId': pi.id,
        });
        if (!booking) {
          logger.error('booking not found');
          break;
        }
        booking.status = 'confirmed';
        booking.paymentStatus = 'captured';
        booking.payment.client.chargeId = (pi.latest_charge as string) || '';

        await booking.save();

        const client = await ClientPreferences.findOne(
          { clientId: booking.client },
          'notificationChannels'
        );

        if (client?.notificationChannels.includes('app')) {
          sendNotificationBySocket({
            title: 'Confirmed Booking',
            message: `your booking is now confirmed by ${booking.artistInfo.fullName} for ${booking.serviceName}.`,
            receiver: booking.client.toString() ?? '',
            type: NOTIFICATION_TYPE.CONFIRMED_BOOKING,
          });
        }

        if (client?.notificationChannels.includes('email')) {
          sendNotificationByEmail(
            booking.artistInfo.email,
            NOTIFICATION_TYPE.BOOKING_REQUEST,
            {
              fullName: booking.clientInfo.fullName,
              serviceName: booking.serviceName,
            }
          );
        }
        const date = new Date();

        const formatted = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        if (client?.notificationChannels.includes('sms')) {
          const clientDoc = await Client.findOne({
            _id: client.clientId,
          }).populate<{ auth: IAuth }>('auth', 'fcmToken');

          if (!clientDoc) {
            throw new AppError(httpStatus.NOT_FOUND, 'user not found');
          }

          if (clientDoc.auth?.fcmToken) {
            await sendPushNotification(clientDoc.auth.fcmToken, {
              title: 'New Booking Request',
              content: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
              time: formatted,
            });
          }
        }

        break;
      }

      // payment failed
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', intent.id);

        const bookingId = intent.metadata.bookingId;
        await Booking.findByIdAndUpdate(bookingId, {
          status: 'pending',
          paymentStatus: 'failed',
        });

        break;
      }

      // charge refund
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('Refund completed:', charge.id);

        // Update booking to refunded
        await Booking.updateOne(
          { paymentIntentId: charge.payment_intent as string },
          { $set: { status: 'cancelled', paymentStatus: 'refunded' } }
        );

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);
