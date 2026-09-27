"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProgramDetailForZoom(programId: string) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        sesiAbsensis: {
          orderBy: { nomorSesi: 'asc' },
          include: {
            rekamanSesis: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });
    return { success: true, data: program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveZoomUrl(programId: string, zoomUrl: string) {
  try {
    await prisma.program.update({
      where: { id: programId },
      data: { zoomUrl }
    });
    revalidatePath("/admin/zoom-rekaman");
    revalidatePath("/portal/zoom-rekaman");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addRekamanSesi(sesiId: string, judul: string, url: string) {
  try {
    await prisma.rekamanSesi.create({
      data: { sesiId, judul, url }
    });
    revalidatePath("/admin/zoom-rekaman");
    revalidatePath("/portal/zoom-rekaman");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRekamanSesi(rekamanId: string) {
  try {
    await prisma.rekamanSesi.delete({
      where: { id: rekamanId }
    });
    revalidatePath("/admin/zoom-rekaman");
    revalidatePath("/portal/zoom-rekaman");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
