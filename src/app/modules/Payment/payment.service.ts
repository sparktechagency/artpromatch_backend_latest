/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import config from '../../config';
import { AppError } from '../../utils';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { IAuth } from '../Auth/auth.interface';

const stripe = new Stripe(config.stripe.secret_key!);

// const stripe = new Stripe(config.stripe.secret_key!, {
//   apiVersion: '2025-01-27.acacia' as any,
// });

export default stripe;

const createSubscriptionIntoDB = async (
  user: IAuth,
  payload: { ammount: string; monthly: boolean }
) => {
  // Convert the amount to cents
  const amountInCents = Number(payload.ammount) * 100;

  // Create a recurring price dynamically (if it's a subscription)
  let lineItem;
  if (payload.monthly) {
    // Create a recurring price (monthly)
    const price = await stripe.prices.create({
      unit_amount: amountInCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: {
        name: 'Monthly Donation',
      },
    });

    lineItem = {
      price: price.id,
      quantity: 1,
    };
  } else {
    // Use one-time payment setup for donations (no recurring charge)
    lineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: user.fullName || 'Anonymous',
          description: 'One-Time Donation',
        },
        unit_amount: amountInCents,
      },
      quantity: 1,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [lineItem],
    mode: payload.monthly ? 'subscription' : 'payment', // 'subscription' for recurring or 'payment' for one-time
    success_url: `${config.client_url}/api/v1/payments/verify?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.client_url}/payment-cancel`,
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    payment_method_types: ['card'],
  });

  return {
    sessionId: session.id,
    url: session.url,
    clientSecret: paymentIntent.client_secret,
  };
};

const verifyPaymentSuccess = async (user: IAuth, sessionId: string) => {
  if (!sessionId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Session ID is required');
  }

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!stripeSession) {
      throw new AppError(httpStatus.NOT_FOUND, 'Session not found!');
    }

    // Check if the payment was successful
    if (stripeSession.payment_status !== 'paid') {
      return { message: 'Payment was not successful' };
    }

    if (!stripeSession.amount_total) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Invalid payment amount from Stripe'
      );
    }

    // Step 5: Commit the transaction
    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return { message: 'Payment was successful' };
  } catch (error: any) {
    await mongoSession.abortTransaction(); // Rollback changes if any error occurs
    mongoSession.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Transaction failed: ${error.message}`
    );
  }
};

export const PaymentService = {
  createSubscriptionIntoDB,
  verifyPaymentSuccess,
};
