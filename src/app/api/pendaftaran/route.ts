import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeNoWa, sendWa, formatPesanPendaftaran } from "@/lib/whatsapp";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

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
      programId,
      username,
      password
    } = body;

    // Validasi basic
    if (!namaLengkap || !periodeId || !programId || !username || !password) {
      return NextResponse.json({ error: "Data wajib belum lengkap (nama, periode, program, username, password)" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    // Normalisasi nomor WA ke format 628xxx
    const noWaNormalized = normalizeNoWa(noWa || "");

    // Cek username unik (di Pendaftaran dan User)
    const existingPendaftaran = await prisma.pendaftaran.findUnique({
      where: { username }
    });
    if (existingPendaftaran) {
      return NextResponse.json({ error: "Username sudah digunakan, silakan pilih username lain" }, { status: 400 });
    }
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan, silakan pilih username lain" }, { status: 400 });
    }

    // Ambil harga dan nama program + periode
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }
    const periode = await prisma.periode.findUnique({
      where: { id: periodeId }
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate random 3-digit kode unik (100 - 999)
    const kodeUnik = Math.floor(100 + Math.random() * 900);
    const totalBiaya = program.harga + kodeUnik;

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        namaLengkap,
        jenisKelamin,
        tempatLahir,
        tanggalLahir: new Date(tanggalLahir),
        noWa: noWaNormalized,
        email,
        provinsiId,
        kotaId,
        kecamatanId,
        detailAlamat,
        periodeId,
        programId,
        status: "MENUNGGU",
        kodeUnik,
        totalBiaya,
        username,
        passwordHash
      }
    });

    // Kirim WA otomatis (jangan gagalkan pendaftaran jika WA gagal)
    try {
      const pesan = formatPesanPendaftaran(
        namaLengkap,
        program.nama,
        periode?.nama || "-",
        totalBiaya,
        kodeUnik,
        username
      );
      await sendWa(noWaNormalized, pesan);
    } catch (waError) {
      console.error("Gagal kirim WA:", waError);
    }

    return NextResponse.json({
      success: true,
      data: pendaftaran,
      message: "Pendaftaran berhasil"
    });

  } catch (error: any) {
    console.error("Error pendaftaran: ", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Username sudah digunakan, silakan pilih username lain" }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar" }, { status: 500 });
  }
}
