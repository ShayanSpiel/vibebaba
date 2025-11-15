import { type NextRequest, NextResponse } from 'next/server';
import {
  getCustomCreditPrice,
  getExchangeRateToRials,
  getPackage,
  tomanToRials,
} from '@/lib/config/pricing-config';
import { createTransaction } from '@/lib/database/pocketbase-credits';
import { getAuthenticatedUser } from '@/lib/database/pocketbase-middleware';
import { RateLimiter, sanitizeError } from '@/lib/database/pocketbase-utils';
import { getPaymentProvider } from '@/lib/payment-providers';

// Rate limiter: 5 payment requests per minute per user
const paymentRateLimiter = new RateLimiter(60000, 5);

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!paymentRateLimiter.checkLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { packageId, customTokens, currency } = await req.json();

    let amount = 0;
    let tokens = 0;
    let description = '';

    // PHASE 2: Use centralized pricing config
    if (packageId) {
      // Package purchase
      const pkg = getPackage(packageId);
      if (!pkg) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }
      tokens = pkg.monthlyTokens;
      amount = currency === 'IRT' ? pkg.prices.IRT : pkg.prices.USD;
      description = `${pkg.name} Package - ${tokens.toLocaleString()} tokens`;
    } else if (customTokens) {
      // Custom token purchase
      tokens = customTokens;
      amount = getCustomCreditPrice(tokens, currency === 'IRT' ? 'IRT' : 'USD');
      description = `Custom Credits - ${tokens.toLocaleString()} tokens`;
    } else {
      return NextResponse.json({ error: 'Invalid purchase type' }, { status: 400 });
    }

    // 🔒 SECURITY: Generate verify token BEFORE creating transaction
    const crypto = require('crypto');
    const verifyToken = crypto
      .createHash('sha256')
      .update(`${user.id}:${Date.now()}:${Math.random()}`)
      .digest('hex');

    // Create transaction record with verify token
    const transactionId = await createTransaction(
      user.id,
      packageId ? 'subscription' : 'purchase',
      amount,
      tokens,
      currency,
      packageId,
      'zarinpal',
      undefined, // paymentId (not known yet)
      verifyToken // Store for verification on callback
    );

    // Create payment with Zarinpal
    const provider = getPaymentProvider('zarinpal');

    // 🔒 SECURITY: Use verify token in callback URL (will be validated on return)
    const callbackUrl = `${req.nextUrl.origin}/api/payment/verify?transactionId=${transactionId}&token=${verifyToken}`;

    // PHASE 2: Convert to Rials using centralized exchange rate
    // Zarinpal uses Rials, so convert from Toman or USD
    const amountInRials =
      currency === 'IRT'
        ? tomanToRials(amount) // Toman to Rials (1 Toman = 10 Rials)
        : amount * getExchangeRateToRials(); // USD to Rials

    const paymentResult = await provider.createPayment({
      amount: amountInRials,
      currency: 'IRT',
      description,
      callbackUrl,
      metadata: {
        transactionId,
        userId: user.id,
        tokens,
      },
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId,
      paymentUrl: paymentResult.paymentUrl,
      paymentId: paymentResult.paymentId,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
