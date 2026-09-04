import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      where: {
        statusAktif: true
      },
      orderBy: {
        nama: 'asc'
      },
      select: {
        id: true,
        nama: true,
        harga: true,
        deskripsi: true
      }
    });
    
    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data program" }, { status: 500 });
  }
}
