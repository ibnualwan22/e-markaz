"use server";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";


export async function getSesiByProgram(programId: string) {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const sessions = await prisma.sesiAbsensi.findMany({
      where: { 
        programId,
        tanggal: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        absensiSantris: true,
        absensiPengajars: {
          include: { pengajar: true }
        }
      },
      orderBy: { tanggal: "asc" }
    });

    if (sessions.length === 0) {
      const today = new Date();
      const dateReadable = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      await prisma.sesiAbsensi.createMany({
        data: [
          {
            judul: `Absen ${dateReadable} — Sesi 1`,
            tanggal: today,
            programId: programId,
            nomorSesi: 1
          },
          {
            judul: `Absen ${dateReadable} — Sesi 2`,
            tanggal: today,
            programId: programId,
            nomorSesi: 2
          }
        ]
      });

      return await prisma.sesiAbsensi.findMany({
        where: { 
          programId,
          tanggal: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          absensiSantris: true,
          absensiPengajars: {
            include: { pengajar: true }
          }
        },
        orderBy: { tanggal: "asc" }
      });
    }

    return sessions;
  } catch (error) {
    return [];
  }
}

export async function getSantriByProgram(programId: string) {
  // Hanya santri aktif dari periode yang sedang aktif (Oktober yang sudah
  // dinonaktifkan tidak ikut tampil meski status pendaftarannya DITERIMA).
  return await prisma.santri.findMany({
    where: {
      isActive: true,
      pendaftaran: { programId, status: "DITERIMA", periode: { statusAktif: true } },
    },
    include: {
      pendaftaran: true
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function createSesi(data: { programId: string }) {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local timezone
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const sesiCount = await prisma.sesiAbsensi.count({
      where: {
        programId: data.programId,
        tanggal: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const nomorSesi = sesiCount + 1;
    const today = new Date();
    const dateReadable = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const judul = `Absen ${dateReadable} — Sesi ${nomorSesi}`;

    await prisma.sesiAbsensi.create({
      data: {
        judul: judul,
        tanggal: today,
        programId: data.programId,
        nomorSesi: nomorSesi
      }
    });
    revalidatePath("/admin/absensi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Simpan absen santri; pengajar yang menyimpan otomatis tercatat hadir
// di sesi itu (tanpa upload bukti) — satu transaksi, gagal semua bila gagal.
export async function saveAbsenSantri(sesiId: string, absens: { santriId: string, status: string }[], pengajarId?: string) {
  try {
    await prisma.$transaction([
      ...absens.map(a =>
        prisma.absensiSantri.upsert({
          where: { sesiId_santriId: { sesiId, santriId: a.santriId } },
          update: { status: a.status },
          create: { sesiId, santriId: a.santriId, status: a.status }
        })
      ),
      ...(pengajarId ? [
        prisma.absensiPengajar.upsert({
          where: { sesiId_pengajarId: { sesiId, pengajarId } },
          update: {},
          create: { sesiId, pengajarId }
        })
      ] : []),
    ]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Catat pengajar hadir di sebuah sesi (dipakai rekap admin untuk koreksi).
export async function saveAbsenPengajar(sesiId: string, pengajarId: string) {
  try {
    await prisma.absensiPengajar.upsert({
      where: { sesiId_pengajarId: { sesiId, pengajarId } },
      update: {},
      create: { sesiId, pengajarId }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
