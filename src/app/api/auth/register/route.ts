import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "אימייל וסיסמה הם שדות חובה" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר רשומה במערכת" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, phone, password: hashedPassword },
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
