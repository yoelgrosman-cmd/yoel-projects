import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function checkAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "ADMIN";
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name, slug, description, price, comparePrice,
      sku, stock, brand, featured, active, categoryId,
      images, variants,
    } = body;

    const finalSlug = slug || slugify(name);

    const product = await prisma.product.create({
      data: {
        name, slug: finalSlug, description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku, stock: parseInt(stock) || 0,
        brand, featured, active,
        categoryId: categoryId || null,
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        variants: {
          create: (variants || []).map((v: { name: string; value: string; stock: number; price?: number | null }) => ({
            name: v.name,
            value: v.value,
            stock: v.stock || 0,
            price: v.price || null,
          })),
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה ביצירת מוצר" }, { status: 500 });
  }
}
