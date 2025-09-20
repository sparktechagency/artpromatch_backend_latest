/* eslint-disable no-console */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new AppError(httpStatus.BAD_REQUEST, err.message);
      }
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        const userId = session.metadata?.userId ?? '';
        const paymentIntentId = session.payment_intent as string;

        const booking = await Booking.findById(bookingId).select(
          'artistInfo clientInfo client artist serviceName'
        );
        if (!booking)
          throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
        await Booking.updateOne(
          { _id: bookingId },
          {
            $set: {
              paymentIntentId: paymentIntentId,
              paymentStatus: PAYMENT_STATUS.AUTHORIZED,
            },
          },
          { runValidators: true }
        );

        const artist = await ArtistPreferences.findOne(
          { artistId: booking.artist },
          'notificationChannels'
        );

        const user = await Auth.findOne({ _id: userId }, 'fcmToken');
        if (!user) throw new AppError(httpStatus.NOT_FOUND, 'user not found');

        if (artist?.notificationChannels.includes('app')) {
          sendNotificationBySocket({
            title: 'New Booking Request',
            message: `you have a new booking request from ${booking.clientInfo.fullName} for ${booking.serviceName}. Please review and confirm.`,
            receiver: booking.artist.toString() ?? '',
            type: NOTIFICATION_TYPE.BOOKING_REQUEST,
          });
        }

        if (artist?.notificationChannels.includes('email')) {
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

        if (artist?.notificationChannels.includes('sms')) {
          if (user.fcmToken) {
            sendPushNotification(user.fcmToken, {
              title: 'New Booking Request',
              content: `you have a new booking request from ${booking.clientInfo.fullName} for${booking.serviceName}. Please review and confirm.`,
              time: formatted,
            });
          }
        }

        break;
      }

      // payment intent succeed
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const charge = await stripe.charges.retrieve(
          pi.latest_charge as string
        );
        const balanceTx = await stripe.balanceTransactions.retrieve(
          charge.balance_transaction as string
        );
        const stripeFeeCents = balanceTx.fee;
        const stripeFee = stripeFeeCents / 100;
        const booking = await Booking.findOne({ paymentIntentId: pi.id });
        if (!booking)
          throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

        booking.status = 'confirmed';
        booking.paymentStatus = 'captured';
        booking.chargeId = (pi.latest_charge as string) || '';
        booking.stripeFee = stripeFee;
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

      default: console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);
