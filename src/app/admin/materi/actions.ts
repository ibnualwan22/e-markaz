"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getMateri(programId: string) {
  try {
    return await prisma.materi.findMany({
      where: { programId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    return [];
  }
}

export async function saveMateri(id: string | null, data: { judul: string, deskripsi: string, fileUrl: string, programId: string, isPublished: boolean }) {
  try {
    if (id) {
      await prisma.materi.update({ where: { id }, data });
    } else {
      await prisma.materi.create({ data });
    }
    revalidatePath("/admin/materi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMateri(id: string) {
  try {
    await prisma.materi.delete({ where: { id } });
    revalidatePath("/admin/materi");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
