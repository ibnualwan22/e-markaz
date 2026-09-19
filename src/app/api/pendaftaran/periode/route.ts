import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const periodes = await prisma.periode.findMany({
      where: {
        statusAktif: true
      },
      orderBy: {
        tanggalBuka: 'desc'
      },
      select: {
        id: true,
        nama: true,
        tanggalBuka: true,
        tanggalTutup: true
      }
    });
    
    return NextResponse.json(periodes);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data periode" }, { status: 500 });
  }
}
