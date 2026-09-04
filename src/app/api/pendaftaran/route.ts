import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      namaLengkap, 
      jenisKelamin, 
      tempatLahir, 
      tanggalLahir, 
      noWa, 
      email, 
      provinsiId, 
      kotaId, 
      kecamatanId, 
      detailAlamat,
      periodeId,
      programId
    } = body;

    // Validasi basic
    if (!namaLengkap || !periodeId || !programId) {
      return NextResponse.json({ error: "Data wajib belum lengkap" }, { status: 400 });
    }

    // Ambil harga dari program
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    // Generate random 3-digit kode unik (100 - 999)
    const kodeUnik = Math.floor(100 + Math.random() * 900);
    const totalBiaya = program.harga + kodeUnik;

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        namaLengkap,
        jenisKelamin,
        tempatLahir,
        tanggalLahir: new Date(tanggalLahir),
        noWa,
        email,
        provinsiId,
        kotaId,
        kecamatanId,
        detailAlamat,
        periodeId,
        programId,
        status: "MENUNGGU",
        kodeUnik,
        totalBiaya
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: pendaftaran,
      message: "Pendaftaran berhasil"
    });

  } catch (error: any) {
    console.error("Error pendaftaran: ", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar" }, { status: 500 });
  }
}
