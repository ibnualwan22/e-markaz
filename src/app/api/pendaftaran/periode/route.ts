import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
