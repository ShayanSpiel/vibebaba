import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";
import { getPaymentProvider } from "@/lib/payment-providers";
import { createTransaction } from "@/lib/pocketbase-credits";
import { getPackage, getCustomCreditPrice, getExchangeRateToRials, tomanToRials } from "@/lib/config/pricing-config";
import { RateLimiter, sanitizeError } from "@/lib/pocketbase-utils";

// Rate limiter: 5 payment requests per minute per user
const paymentRateLimiter = new RateLimiter(60000, 5);

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    if (!paymentRateLimiter.checkLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many payment requests. Please try again later." },
        { status: 429 }
      );
    }

    const { packageId, customTokens, currency } = await req.json();

    let amount = 0;
    let tokens = 0;
    let description = "";

    // PHASE 2: Use centralized pricing config
    if (packageId) {
      // Package purchase
      const pkg = getPackage(packageId);
      if (!pkg) {
        return NextResponse.json({ error: "Invalid package" }, { status: 400 });
      }
      tokens = pkg.monthlyTokens;
      amount = currency === "IRT" ? pkg.prices.IRT : pkg.prices.USD;
      description = `${pkg.name} Package - ${tokens.toLocaleString()} tokens`;
    } else if (customTokens) {
      // Custom token purchase
      tokens = customTokens;
      amount = getCustomCreditPrice(tokens, currency === "IRT" ? "IRT" : "USD");
      description = `Custom Credits - ${tokens.toLocaleString()} tokens`;
    } else {
      return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 });
    }

    // Create transaction record
    const transactionId = await createTransaction(
      user.id,
      packageId ? "subscription" : "purchase",
      amount,
      tokens,
      currency,
      packageId,
      "zarinpal"
    );

    // Create payment with Zarinpal
    const provider = getPaymentProvider("zarinpal");
    const callbackUrl = `${req.nextUrl.origin}/api/payment/verify?transactionId=${transactionId}`;

    // PHASE 2: Convert to Rials using centralized exchange rate
    // Zarinpal uses Rials, so convert from Toman or USD
    const amountInRials = currency === "IRT"
      ? tomanToRials(amount)  // Toman to Rials (1 Toman = 10 Rials)
      : amount * getExchangeRateToRials(); // USD to Rials

    const paymentResult = await provider.createPayment({
      amount: amountInRials,
      currency: "IRT",
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
        { error: paymentResult.error || "Payment creation failed" },
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
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
