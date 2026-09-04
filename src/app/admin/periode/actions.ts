"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

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
    await prisma.periode.update({ where: { id }, data: { statusAktif } });
    revalidatePath("/admin/periode");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
