"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { saveAbsenPengajar } from "../absensi/actions";

// Tandai pengajar hadir di sebuah sesi (koreksi admin di rekap).
export async function tandaiHadir(sesiId: string, pengajarId: string) {
  const res = await saveAbsenPengajar(sesiId, pengajarId);
  if (res.success) revalidatePath("/admin/rekap-absensi-pengajar");
  return res;
}

// Hapus catatan kehadiran pengajar di sebuah sesi (ditandai tidak hadir).
export async function hapusAbsenPengajar(id: string) {
  try {
    await prisma.absensiPengajar.delete({ where: { id } });
    revalidatePath("/admin/rekap-absensi-pengajar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
