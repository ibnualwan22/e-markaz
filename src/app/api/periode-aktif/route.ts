import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const active = await prisma.periode.findFirst({
      where: { statusAktif: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(active);
  } catch (error) {
    return NextResponse.json(null, { status: 500 });
  }
}
