import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { getTranzilaIframeUrl } from "@/lib/tranzila";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingType,
      branchPickup,
      address,
      notes,
    } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "העגלה ריקה" }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );

    const shippingCost = shippingType === "DELIVERY" && subtotal < 250 ? 35 : 0;
    const total = subtotal + shippingCost;

    // Create or find address
    let addressId: string | undefined;
    if (shippingType === "DELIVERY" && address && session?.user?.id) {
      const addr = await prisma.address.create({
        data: {
          userId: session.user.id,
          street: address.street,
          city: address.city,
          zipCode: address.zipCode,
        },
      });
      addressId = addr.id;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id,
        customerName,
        customerEmail,
        customerPhone,
        shippingType,
        branchPickup,
        addressId,
        subtotal,
        shippingCost,
        total,
        notes,
        items: {
          create: items.map(
            (item: {
              productId: string;
              name: string;
              price: number;
              quantity: number;
              variant?: string;
            }) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              variant: item.variant,
            })
          ),
        },
      },
    });

    // Generate Tranzila iFrame URL
    const paymentUrl = getTranzilaIframeUrl({
      amount: total,
      orderId: order.id,
      customerName,
      customerEmail,
    });

    return NextResponse.json({ orderId: order.id, paymentUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
