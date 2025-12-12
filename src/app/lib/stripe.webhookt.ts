/* eslint-disable no-console */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
// import logger from '../config/logger';
// import { IAuth } from '../modules/Auth/auth.interface';
import Artist from '../modules/Artist/artist.model';
import { IAuth } from '../modules/Auth/auth.interface';
import Auth from '../modules/Auth/auth.model';
import Booking from '../modules/Booking/booking.model';
import { ArtistBoost } from '../modules/BoostProfile/boost.profile.model';
import Service from '../modules/Service/service.model';
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new AppError(httpStatus.BAD_REQUEST, err.message);
      }
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid webhook signature');
    }
    const pi = event.data.object as Stripe.PaymentIntent;
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
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;
        const artistId = session.metadata?.artistId ?? '';

        const boostId = session.metadata?.boostId;

        if (boostId) {
          console.log(boostId);
          await ArtistBoost.findOneAndUpdate(
            { _id: boostId },
            {
              paymentStatus: 'succeeded',
              isActive: true,
              paymentIntentId: paymentIntentId,
            },
            { new: true }
          );

          // also update artist.boost
          await Artist.findByIdAndUpdate(artistId, {
            boost: {
              lastBoostAt: new Date(),
              endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
              isActive: true,
            },
          });
        }
      }

      case 'payment_intent.amount_capturable_updated': {
        const userId = pi.metadata.clientId;
        const serviceId = pi.metadata.serviceId;

        // Check for duplicate pending booking (optional)

        const service = await Service.findById(serviceId).select(
          'artist title description bodyLocation price'
        );

        if (!service) {
          throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
        }

        const artist = await Service.findById(service.artist)
          .select('auth')
          .populate<{ auth: IAuth }>('auth', 'fullName email phone');

        const user = await Auth.findById(userId);

        const existingBooking = await Booking.findOne({
          client: userId,
          service: serviceId,
          paymentStatus: { $in: ['authorized', 'captured'] },
        });
        if (existingBooking) return res.json({ received: true });

        const bookingPayload = {
          artist: service.artist,
          client: userId,
          service: service._id,
          clientInfo: {
            fullName: user?.fullName,
            email: user?.email,
            phone: user?.phoneNumber,
          },
          artistInfo: {
            fullName: artist?.auth.fullName,
            email: artist?.auth.email,
            phone: artist?.auth.phoneNumber,
          },
          preferredDate: {
            startDate: pi.metadata.preferredStartDate,
            endDate: pi.metadata.preferredEndDate,
          },
          serviceName: service.title,
          bodyPart: service.bodyLocation,
          price: service.price,
          paymentStatus: 'pending',
        };

        // Create booking in DB with status 'authorized'
        const booking = await Booking.create(bookingPayload);

        // Notify artist / app
        console.log('Booking authorized and created:', booking._id);
      }

      // payment failed
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;

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

/*

  case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;
        const artistId = session.metadata?.artistId ?? '';
        try {
          const boostId = session.metadata?.boostId;

          if (boostId) {
            console.log(boostId);
            await ArtistBoost.findOneAndUpdate(
              { _id: boostId },
              {
                paymentStatus: 'succeeded',
                isActive: true,
                paymentIntentId: paymentIntentId,
              },
              { new: true }
            );

            // also update artist.boost
            await Artist.findByIdAndUpdate(artistId, {
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
            console.warn('Checkout session missing bookingId in metadata', {
              sessionId: session.id,
              event: event.type,
            });
            break;
          }

          console.info('Checkout session completed', {
            bookingId,
            userId,
            sessionId: session.id,
            event: event.type,
          });

          const booking = await Booking.findById(bookingId).select(
            'artistInfo clientInfo client artist serviceName'
          );
          if (!booking) {
            console.error('Booking not found', { bookingId });
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
            console.warn('User not found for booking', { bookingId, userId });
          }

          // Notifications
          if (artist?.notificationChannels.includes('app')) {
            try {
              await sendNotificationBySocket({
                title: 'New Booking Request',
                message: `You have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
                receiver: userId ?? '',
                type: NOTIFICATION_TYPE.BOOKING_REQUEST,
              });
              console.info('App notification sent', {
                bookingId,
                artistId: booking.artist,
              });
            } catch (err) {
              console.error('Failed to send app notification', {
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
              console.info('Email notification sent', {
                bookingId,
                artistId: booking.artist,
              });
            } catch (err) {
              console.error('Failed to send email notification', {
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
              console.info('Push notification sent', { bookingId, userId });
            } catch (err) {
              console.error('Failed to send push notification', {
                error: err,
                bookingId,
                userId,
              });
            }
          }
        } catch (err) {
          console.error(
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


*/
