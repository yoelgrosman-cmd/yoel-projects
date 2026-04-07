const TRANZILA_TERMINAL = process.env.TRANZILA_TERMINAL || "bilubikes";

export interface TranzilaPaymentParams {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  currency?: string;
  maxPayments?: number;
}

export function getTranzilaIframeUrl(params: TranzilaPaymentParams): string {
  const baseUrl = "https://direct.tranzila.com";
  const searchParams = new URLSearchParams({
    supplier: TRANZILA_TERMINAL,
    sum: params.amount.toString(),
    currency: params.currency || "1",
    cred_type: "1",
    maxpay: (params.maxPayments || 12).toString(),
    tranmode: "V",
    nologo: "0",
    hidesum: "0",
    lang: "il",
    u71: "1",
    trBgColor: "1a2744",
    trTextColor: "ffffff",
    notify_url: `${process.env.NEXTAUTH_URL}/api/tranzila/webhook`,
    success_url: `${process.env.NEXTAUTH_URL}/checkout/success?order=${params.orderId}`,
    fail_url: `${process.env.NEXTAUTH_URL}/checkout/failed`,
    customFields: JSON.stringify({ orderId: params.orderId }),
  });

  return `${baseUrl}/${TRANZILA_TERMINAL}/iframe/?${searchParams.toString()}`;
}

export function verifyTranzilaWebhook(params: Record<string, string>): boolean {
  // Basic validation - in production add HMAC signature verification
  return params.Response === "000" && params.supplier === TRANZILA_TERMINAL;
}
