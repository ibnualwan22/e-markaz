"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function setStatusValidasi(id: string, statusValidasi: string) {
  try {
    await prisma.absensiPengajar.update({
      where: { id },
      data: { statusValidasi }
    });
    revalidatePath("/admin/rekap-absensi-pengajar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
