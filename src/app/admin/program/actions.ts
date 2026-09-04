"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getPrograms() {
  try {
    return await prisma.program.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveProgram(id: string | null, data: { nama: string, harga: number, deskripsi: string, statusAktif: boolean }) {
  try {
    if (id) {
      await prisma.program.update({ where: { id }, data });
    } else {
      await prisma.program.create({ data });
    }
    revalidatePath("/admin/program");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProgram(id: string) {
  try {
    await prisma.program.delete({ where: { id } });
    revalidatePath("/admin/program");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleProgramStatus(id: string, statusAktif: boolean) {
  try {
    await prisma.program.update({ where: { id }, data: { statusAktif } });
    revalidatePath("/admin/program");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
