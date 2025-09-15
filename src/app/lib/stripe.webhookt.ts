import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
import Booking from '../modules/Booking/booking.model';
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
        console.error('Webhook signature verification failed:', err.message);
      } else {
        console.error('Webhook signature verification failed:', err);
      }
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;
        const paymentIntentId = session.payment_intent as string;
        console.log('checkout session completed');
        if (!bookingId)
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'missing bookingId in metadata'
          );
        await Booking.updateOne(
          { _id: bookingId },
          {
            $set: { paymentIntentId: paymentIntentId },
          },
          { runValidators: true }
        );

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);

        // Update booking to confirmed
        await Booking.updateOne(
          { paymentIntentId: paymentIntent.id },
          { $set: { status: 'confirmed', paymentStatus: 'succeeded' } },
          { runValidators: true }
        );

        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', intent.id);

        const bookingId = intent.metadata.bookingId;
        await Booking.findByIdAndUpdate(bookingId, {
          status: 'cancelled',
          paymentStatus: 'failed',
        });

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Refund completed:', charge.id);

        // Update booking to refunded
        await Booking.updateOne(
          { paymentIntentId: charge.payment_intent as string },
          { $set: { status: 'refunded' } }
        );

        break;
      }

      default:
        console.log(`⚠️ Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  }
);
