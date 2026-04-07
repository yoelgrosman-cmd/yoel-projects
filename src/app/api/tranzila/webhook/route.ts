import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTranzilaWebhook } from "@/lib/tranzila";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    if (!verifyTranzilaWebhook(params)) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }

    const orderId = params.customFields
      ? JSON.parse(params.customFields)?.orderId
      : null;

    if (!orderId) {
      return NextResponse.json({ error: "No order ID" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        tranzilaRef: params.index || params.ConfirmationCode,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Also handle GET for Tranzila confirmation
export async function GET(req: NextRequest) {
  return POST(req);
}
