import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment-providers";
import {
  getTransaction,
  updateTransactionStatus,
  addTokens,
  activatePackage,
} from "@/lib/pocketbase-credits";
import { getExchangeRateToRials, tomanToRials } from "@/lib/config/pricing-config";
import { sanitizeError, validateUrl } from "@/lib/pocketbase-utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authority = searchParams.get("Authority");
    const status = searchParams.get("Status");
    const transactionId = searchParams.get("transactionId");

    if (!authority || !transactionId) {
      return NextResponse.redirect(
        new URL("/pricing?error=invalid_payment", req.nextUrl.origin)
      );
    }

    // Check if payment was cancelled
    if (status === "NOK") {
      await updateTransactionStatus(transactionId, "cancelled");
      return NextResponse.redirect(
        new URL("/pricing?error=payment_cancelled", req.nextUrl.origin)
      );
    }

    // Get transaction
    const transaction = await getTransaction(transactionId);
    if (!transaction) {
      return NextResponse.redirect(new URL("/pricing?error=not_found", req.nextUrl.origin));
    }

    // Verify transaction hasn't already been completed (prevent double-processing)
    if (transaction.status === "completed") {
      return NextResponse.redirect(
        new URL("/pricing?error=already_processed", req.nextUrl.origin)
      );
    }

    // Verify payment with Zarinpal
    const provider = getPaymentProvider("zarinpal");

    // PHASE 2: Convert amount to Rials using centralized exchange rate
    const amountInRials = transaction.currency === "IRT"
      ? tomanToRials(transaction.amount)
      : transaction.amount * getExchangeRateToRials();

    const verifyResult = await provider.verifyPayment({
      paymentId: transactionId,
      authority,
      amount: amountInRials,
    });

    if (!verifyResult.success) {
      await updateTransactionStatus(transactionId, "failed");
      return NextResponse.redirect(
        new URL("/pricing?error=verification_failed", req.nextUrl.origin)
      );
    }

    // Payment successful - add tokens
    await updateTransactionStatus(transactionId, "completed");

    if (transaction.packageId) {
      // Activate package subscription
      await activatePackage(transaction.userId, transaction.packageId);
    } else {
      // Add custom tokens
      await addTokens(transaction.userId, transaction.tokens, transactionId);
    }

    // Redirect to success page with validated URL
    const successUrl = new URL("/pricing", req.nextUrl.origin);
    successUrl.searchParams.set("success", "true");
    successUrl.searchParams.set("tokens", String(transaction.tokens));
    successUrl.searchParams.set("package", transaction.packageId || "custom");
    successUrl.searchParams.set("refId", String(verifyResult.refId));

    return NextResponse.redirect(successUrl);
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.redirect(new URL("/pricing?error=server_error", req.nextUrl.origin));
  }
}
