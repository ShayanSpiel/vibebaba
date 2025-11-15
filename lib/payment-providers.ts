/**
 * Payment Provider Interface
 * This allows dynamic support for multiple payment gateways
 */

export interface PaymentProvider {
  name: string;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse>;
}

export interface CreatePaymentParams {
  amount: number; // in provider's currency
  currency: string;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface VerifyPaymentParams {
  paymentId: string;
  authority?: string; // For Zarinpal
  [key: string]: any; // Provider-specific params
}

export interface VerifyPaymentResponse {
  success: boolean;
  refId?: string;
  cardPan?: string;
  error?: string;
}

/**
 * Zarinpal Payment Provider
 */
export class ZarinpalProvider implements PaymentProvider {
  name = 'zarinpal';
  private merchantId: string;
  private sandbox: boolean;

  constructor(merchantId: string, sandbox: boolean = false) {
    this.merchantId = merchantId;
    this.sandbox = sandbox;
  }

  private getBaseUrl(): string {
    return this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://payment.zarinpal.com/pg/v4/payment';
  }

  private getPaymentPageUrl(): string {
    return this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/request.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: params.amount,
          description: params.description,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        }),
      });

      const data = await response.json();

      if (data.data && data.data.code === 100) {
        return {
          success: true,
          paymentId: data.data.authority,
          paymentUrl: `${this.getPaymentPageUrl()}/${data.data.authority}`,
        };
      }

      return {
        success: false,
        error: data.errors?.message || 'Payment creation failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/verify.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          authority: params.authority,
          amount: params.amount,
        }),
      });

      const data = await response.json();

      if (data.data && data.data.code === 100) {
        return {
          success: true,
          refId: data.data.ref_id?.toString(),
          cardPan: data.data.card_pan,
        };
      }

      return {
        success: false,
        error: data.errors?.message || 'Payment verification failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }
}

/**
 * Payment Provider Factory
 */
export function getPaymentProvider(providerName: string = 'zarinpal'): PaymentProvider {
  switch (providerName) {
    case 'zarinpal':
      return new ZarinpalProvider(
        process.env.ZARINPAL_MERCHANT_ID || '24b3c9e7-e59d-4428-b36d-3732925ddc81',
        process.env.NODE_ENV !== 'production' // Use sandbox in development
      );
    default:
      throw new Error(`Payment provider ${providerName} not supported`);
  }
}
