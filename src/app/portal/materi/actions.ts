"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

const userSelectArg = {
  username: true,
  role: { select: { name: true } },
  santri: {
    select: {
      pendaftaran: {
        select: {
          namaLengkap: true
        }
      }
    }
  }
};

export async function getKomentarByMateri(materiId: string, halaman: number) {
  try {
    const komentars = await prisma.komentarMateri.findMany({
      where: { 
        materiId, 
        halaman 
      },
      include: {
        user: { select: userSelectArg }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return { success: true, data: komentars };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function tambahKomentar(materiId: string, halaman: number, isi: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const komentar = await prisma.komentarMateri.create({
      data: {
        materiId,
        halaman,
        isi,
        userId: session.user.id
      },
      include: {
        user: { select: userSelectArg }
      }
    });

    try {
      await pusherServer.trigger(`materi-${materiId}-hal-${halaman}`, 'new-comment', komentar);
    } catch (pushErr) {
      console.error("Pusher trigger failed:", pushErr);
    }

    return { success: true, data: komentar };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function hapusKomentar(komentarId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthenticated" };
    }

    const komentar = await prisma.komentarMateri.findUnique({ where: { id: komentarId } });
    if (!komentar) return { success: false, error: "Komentar tidak ditemukan" };

    const isAdmin = session.user.role === 'SUPERADMIN' || session.user.role === 'ADMIN';

    if (komentar.userId !== session.user.id && !isAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.komentarMateri.delete({ where: { id: komentarId } });
    
    try {
      await pusherServer.trigger(`materi-${komentar.materiId}-hal-${komentar.halaman}`, 'delete-comment', { id: komentarId });
    } catch (pushErr) {
      console.error("Pusher trigger failed:", pushErr);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
