"use server";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";


export async function getPeriodes() {
  try {
    return await prisma.periode.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function savePeriode(id: string | null, data: { nama: string, tanggalBuka: string, tanggalTutup: string, statusAktif: boolean }) {
  try {
    const payload = {
      nama: data.nama,
      tanggalBuka: new Date(data.tanggalBuka),
      tanggalTutup: new Date(data.tanggalTutup),
      statusAktif: data.statusAktif
    };

    // Jika diaktifkan, nonaktifkan semua periode lain dulu (hanya 1 yang boleh aktif)
    if (data.statusAktif) {
      await prisma.periode.updateMany({
        where: { id: id ? { not: id } : undefined },
        data: { statusAktif: false }
      });
    }

    if (id) {
      await prisma.periode.update({ where: { id }, data: payload });
    } else {
      await prisma.periode.create({ data: payload });
    }
    revalidatePath("/admin/periode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePeriode(id: string) {
  try {
    await prisma.periode.delete({ where: { id } });
    revalidatePath("/admin/periode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleStatus(id: string, statusAktif: boolean) {
  try {
    // Jika diaktifkan, nonaktifkan semua periode lain dulu (hanya 1 yang boleh aktif)
    if (statusAktif) {
      await prisma.periode.updateMany({
        where: { id: { not: id } },
        data: { statusAktif: false }
      });
    }
    await prisma.periode.update({ where: { id }, data: { statusAktif } });
    revalidatePath("/admin/periode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cleanupDuplicateActive() {
  try {
    // Cari semua periode aktif, urutkan terbaru dulu
    const actives = await prisma.periode.findMany({
      where: { statusAktif: true },
      orderBy: { createdAt: 'desc' }
    });

    if (actives.length <= 1) {
      return { success: true, message: "Sudah hanya 1 yang aktif", cleaned: 0 };
    }

    // Pertahankan yang terbaru, nonaktifkan sisanya
    const keepId = actives[0].id;
    const result = await prisma.periode.updateMany({
      where: {
        id: { not: keepId },
        statusAktif: true
      },
      data: { statusAktif: false }
    });

    revalidatePath("/admin/periode");
    return {
      success: true,
      message: `Berhasil. Periode "${actives[0].nama}" tetap aktif, ${result.count} lainnya dinonaktifkan.`,
      cleaned: result.count
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
