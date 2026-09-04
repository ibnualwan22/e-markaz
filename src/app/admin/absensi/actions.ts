"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getSesiByProgram(programId: string) {
  try {
    return await prisma.sesiAbsensi.findMany({
      where: { programId },
      include: {
        absensiSantris: true,
        absensiPengajars: {
          include: { pengajar: true }
        }
      },
      orderBy: { tanggal: "asc" }
    });
  } catch (error) {
    return [];
  }
}

export async function getSantriByProgram(programId: string) {
  return await prisma.santri.findMany({
    where: { pendaftaran: { programId, status: "DITERIMA" } },
    include: {
      pendaftaran: true
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function createSesi(data: { judul: string, tanggal: string, programId: string, nomorSesi: number }) {
  try {
    await prisma.sesiAbsensi.create({
      data: {
        judul: data.judul,
        tanggal: new Date(data.tanggal),
        programId: data.programId,
        nomorSesi: data.nomorSesi
      }
    });
    revalidatePath("/admin/absensi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAbsenSantri(sesiId: string, absens: { santriId: string, status: string }[]) {
  try {
    await prisma.$transaction(
      absens.map(a => 
        prisma.absensiSantri.upsert({
          where: { sesiId_santriId: { sesiId, santriId: a.santriId } },
          update: { status: a.status },
          create: { sesiId, santriId: a.santriId, status: a.status }
        })
      )
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAbsenPengajar(sesiId: string, pengajarId: string, screenshotUrl: string) {
  try {
    await prisma.absensiPengajar.upsert({
      where: { sesiId_pengajarId: { sesiId, pengajarId } },
      update: { screenshotUrl, statusValidasi: "PENDING" },
      create: { sesiId, pengajarId, screenshotUrl, statusValidasi: "PENDING" }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
